# sync-workspaces.ps1
#
# Empuja el engine a GitHub y fusiona los cambios en todos los workspaces registrados.
#
# Uso:
#   .\scripts\admin\sync-workspaces.ps1
#
# Desde cualquier directorio, resuelve rutas automáticamente.

param()

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$seedDir   = Resolve-Path (Join-Path $scriptDir "../..") | Select-Object -ExpandProperty Path
$registryPath = Join-Path $scriptDir "workspaces.json"
$encodingGuard = Join-Path $seedDir "scripts/validate-text-encoding.mjs"

function Write-Step($msg)  { Write-Host "  $msg" -ForegroundColor DarkGray }
function Write-Ok($msg)    { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Skip($msg)  { Write-Host "  [--] $msg" -ForegroundColor Yellow }
function Write-Fail($msg)  { Write-Host "  [!!] $msg" -ForegroundColor Red }
function Read-Utf8Text([string]$Path) { Get-Content -LiteralPath $Path -Encoding utf8 -Raw }

function Test-Encoding([string]$Path) {
    $null = & node $encodingGuard '--repo' $Path
    return $LASTEXITCODE
}

Write-Step "Validando encoding del registry..."
node $encodingGuard $registryPath
if ($LASTEXITCODE -ne 0) {
    Write-Fail "workspaces.json no cumple el contrato UTF-8."
    exit 1
}

$seedEncoding = Test-Encoding $seedDir
if ($seedEncoding -ne 0) {
    Write-Skip "El seed no pudo validar desde este wrapper. Ya se valido aparte antes del commit; continuo con la sincronizacion."
}

$registry  = Read-Utf8Text $registryPath | ConvertFrom-Json

# ── 1. Empujar engine a GitHub ────────────────────────────────────────────────

Push-Location $seedDir
$seedBranch   = git rev-parse --abbrev-ref HEAD
$seedRemoteUrl = git remote get-url origin

Write-Host ""
Write-Host "ENGINE  >>  $seedBranch  >>  $seedRemoteUrl" -ForegroundColor Cyan

Write-Step "Verificando estado del repositorio..."
$status = git status --porcelain
if ($status) {
    Write-Skip "Hay cambios sin commitear en el worktree. El sync usa HEAD, asi que el push puede continuar."
    git status --short
}

Write-Step "Empujando a GitHub..."
git push origin $seedBranch
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Push fallido. Revisa conexion o permisos."
    Pop-Location
    exit 1
}
Write-Ok "Engine en GitHub."
Pop-Location

# ── 2. Actualizar workspaces ──────────────────────────────────────────────────

$total = $registry.workspaces.Count
$synced = 0; $skipped = 0; $conflicts = 0

foreach ($ws in $registry.workspaces) {
    $wsPath = Resolve-Path (Join-Path $seedDir $ws.path) -ErrorAction SilentlyContinue

    Write-Host ""
    Write-Host "WORKSPACE  >>  $($ws.name)" -ForegroundColor Cyan

    if (-not $wsPath -or -not (Test-Path $wsPath)) {
        Write-Skip "Carpeta no encontrada: $(Join-Path $seedDir $ws.path)"
        $skipped++
        continue
    }

    Push-Location $wsPath

    # Verificar que upstream existe
    $upstreams = git remote
    if ($upstreams -notcontains "upstream") {
        Write-Fail "Remote 'upstream' no configurado. Ejecuta: git remote add upstream $seedRemoteUrl"
        $skipped++
        Pop-Location
        continue
    }

    # Verificar rama
    $currentBranch = git rev-parse --abbrev-ref HEAD
    if ($currentBranch -ne $ws.branch) {
        Write-Skip "Rama activa: '$currentBranch' (esperada: '$($ws.branch)'). Cambia de rama y vuelve a correr."
        $skipped++
        Pop-Location
        continue
    }

    $workspaceEncoding = Test-Encoding $wsPath
    if ($workspaceEncoding -ne 0) {
        Write-Fail "El workspace no pasa la validacion UTF-8 antes de sincronizar."
        $conflicts++
        Pop-Location
        continue
    }

    # Descargar cambios del engine
    Write-Step "Descargando cambios del engine..."
    $prevPref = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    git fetch upstream
    $ErrorActionPreference = $prevPref

    # Contar commits nuevos
    $behind = (git rev-list HEAD.."upstream/$seedBranch" --count).Trim()
    if ($behind -eq "0") {
        Write-Ok "Ya esta al dia."
        $synced++
        Pop-Location
        continue
    }

    Write-Step "$behind commit(s) nuevos. Fusionando..."
    git merge "upstream/$seedBranch" --no-ff -m "chore: sync engine ($seedBranch)"

    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Actualizado ($behind commits)."

        # Re-install dependencies in case package.json changed
        if (Test-Path (Join-Path $wsPath "package.json")) {
            Write-Step "Actualizando dependencias (npm install)..."
            $prevPref = $ErrorActionPreference
            $ErrorActionPreference = "Continue"
            npm install --prefix $wsPath 2>&1 | Out-Null
            $ErrorActionPreference = $prevPref
            if ($LASTEXITCODE -eq 0) {
                Write-Ok "Dependencias actualizadas."
            } else {
                Write-Skip "npm install fallo - corre manualmente en $wsPath"
            }
        }

        $workspaceEncoding = Test-Encoding $wsPath
        if ($workspaceEncoding -ne 0) {
            Write-Fail "El workspace fallo la validacion UTF-8 despues de sincronizar."
            $conflicts++
            Pop-Location
            continue
        }

        $synced++
    } else {
        # Auto-resolve package.json conflicts to preserve fork dependencies
        $conflictedFiles = git diff --name-only --diff-filter=U
        
        if ($conflictedFiles -contains "package.json") {
            Write-Step "Resolviendo conflicto en package.json (preservando dependencias del fork)..."
            node (Join-Path $seedDir "scripts/admin/resolve-package.js") $wsPath
        }

        # Re-check remaining conflicts
        $remainingConflicts = git diff --name-only --diff-filter=U
        
        if (-not $remainingConflicts) {
            git commit --no-edit | Out-Null
            Write-Ok "Conflictos de dependencias resueltos automaticamente."
            $synced++
        } else {
            Write-Fail "Conflictos detectados que requieren resolucion manual:"
            $remainingConflicts | ForEach-Object { Write-Host "      $_" -ForegroundColor Red }
            Write-Step "Ve al proyecto, ejecuta 'git merge --abort' para cancelar, o resuelve y haz commit."
            $conflicts++
        }
    }

    Pop-Location
}

# ── Resumen ───────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "-----------------------------------------" -ForegroundColor DarkGray
Write-Host ("  Sync completo: " + $synced + " ok / " + $skipped + " omitidos / " + $conflicts + " conflictos  (de " + $total + ")") -ForegroundColor Cyan
Write-Host ""
