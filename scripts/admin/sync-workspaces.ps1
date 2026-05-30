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
$registry  = Get-Content (Join-Path $scriptDir "workspaces.json") | ConvertFrom-Json

function Write-Step($msg)  { Write-Host "  $msg" -ForegroundColor DarkGray }
function Write-Ok($msg)    { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Skip($msg)  { Write-Host "  [--] $msg" -ForegroundColor Yellow }
function Write-Fail($msg)  { Write-Host "  [!!] $msg" -ForegroundColor Red }

# ── 1. Empujar engine a GitHub ────────────────────────────────────────────────

Push-Location $seedDir
$seedBranch   = git rev-parse --abbrev-ref HEAD
$seedRemoteUrl = git remote get-url origin

Write-Host ""
Write-Host "ENGINE  ›  $seedBranch  ›  $seedRemoteUrl" -ForegroundColor Cyan

Write-Step "Verificando estado del repositorio..."
$status = git status --porcelain
if ($status) {
    Write-Fail "Hay cambios sin commitear. Haz commit antes de sincronizar."
    git status --short
    Pop-Location
    exit 1
}

Write-Step "Empujando a GitHub..."
git push origin $seedBranch
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Push fallido. Revisa conexión o permisos."
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
    Write-Host "WORKSPACE  ›  $($ws.name)" -ForegroundColor Cyan

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

    # Descargar cambios del engine
    Write-Step "Descargando cambios del engine..."
    git fetch upstream 2>$null

    # Contar commits nuevos
    $behind = (git rev-list HEAD.."upstream/$seedBranch" --count).Trim()
    if ($behind -eq "0") {
        Write-Ok "Ya está al día."
        $synced++
        Pop-Location
        continue
    }

    Write-Step "$behind commit(s) nuevos. Fusionando..."
    git merge "upstream/$seedBranch" --no-ff -m "chore: sync engine ($seedBranch)"

    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Actualizado ($behind commits)."
        $synced++
    } else {
        Write-Fail "Conflictos detectados. Archivos afectados:"
        git diff --name-only --diff-filter=U | ForEach-Object { Write-Host "      $_" -ForegroundColor Red }
        Write-Step "Ejecuta 'git merge --abort' para cancelar, o resuelve y haz commit."
        $conflicts++
    }

    Pop-Location
}

# ── Resumen ───────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "─────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  Sync completo: $synced ok · $skipped omitidos · $conflicts conflictos  (de $total)" -ForegroundColor Cyan
Write-Host ""
