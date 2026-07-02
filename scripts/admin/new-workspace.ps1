# new-workspace.ps1
#
# Crea un nuevo workspace a partir del engine seed.
# Clona el seed, crea el repo en GitHub, configura remotos, y lo registra en workspaces.json.
#
# Uso:
#   .\scripts\admin\new-workspace.ps1 -Name mi_proyecto
#   .\scripts\admin\new-workspace.ps1 -Name mi_proyecto -Branch main -Private

param(
    [Parameter(Mandatory)]
    [string]$Name,

    [string]$Branch = "",   # vacio = usar la rama activa del seed

    [switch]$Private = $true
)

$ErrorActionPreference = "Stop"

$scriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$seedDir     = Resolve-Path (Join-Path $scriptDir "../..") | Select-Object -ExpandProperty Path
$registryPath = Join-Path $scriptDir "workspaces.json"
$encodingGuard = Join-Path $seedDir "scripts/validate-text-encoding.mjs"
$seedUrl     = (& git -C $seedDir remote get-url origin)

# Usar la rama activa del seed como fuente de verdad
$seedBranch = (& git -C $seedDir rev-parse --abbrev-ref HEAD).Trim()
if (-not $Branch) { $Branch = $seedBranch }

# El workspace queda como hermano del engine seed
$parentDir   = Split-Path -Parent $seedDir
$wsPath      = Join-Path $parentDir $Name
# Ruta relativa almacenada en workspaces.json (relativa al seedDir)
$wsRelPath   = "../$Name"

function Write-Step($msg) { Write-Host "  $msg" -ForegroundColor DarkGray }
function Write-Ok($msg)   { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Fail($msg) { Write-Host "  [!!] $msg" -ForegroundColor Red; exit 1 }
function Read-Utf8Text([string]$Path) { Get-Content -LiteralPath $Path -Encoding utf8 -Raw }
function Write-Utf8NoBom([string]$Path, [string]$Content) {
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

Write-Host ""
Write-Host "NUEVO WORKSPACE  |  $Name" -ForegroundColor Cyan
Write-Host "  Destino: $wsPath" -ForegroundColor DarkGray
Write-Host ""

Write-Step "Validando encoding del registry..."
node $encodingGuard $registryPath
if ($LASTEXITCODE -ne 0) {
    Write-Fail "workspaces.json no cumple el contrato UTF-8."
}

# Guardia: no pisar un workspace existente

if (Test-Path $wsPath) {
    Write-Fail "La carpeta '$wsPath' ya existe. Elige otro nombre."
}

$registry = Read-Utf8Text $registryPath | ConvertFrom-Json
$exists = $registry.workspaces | Where-Object { $_.name -eq $Name }
if ($exists) {
    Write-Fail "'$Name' ya esta registrado en workspaces.json."
}

# 1. Clonar el seed

Write-Step "Clonando engine seed (rama: $Branch)..."
git clone $seedUrl $wsPath --branch $Branch
if ($LASTEXITCODE -ne 0) { Write-Fail "No se pudo clonar el seed." }
Write-Ok "Clonado en $wsPath"

Push-Location $wsPath

# 2. Renombrar remotos: seed pasa a ser upstream, no origin

Write-Step "Configurando remotos (seed -> upstream)..."
git remote rename origin upstream

# 3. Crear repo en GitHub

Write-Step "Creando repo en GitHub ($Name)..."
$visibility = if ($Private) { "--private" } else { "--public" }
gh repo create $Name $visibility
if ($LASTEXITCODE -ne 0) { Write-Fail "No se pudo crear el repo en GitHub." }

$ghUser  = (gh api user --jq ".login")
$newOrigin = "https://github.com/$ghUser/$Name.git"
git remote add origin $newOrigin
Write-Ok "Repo creado: $newOrigin"

# 4. Empujar rama al nuevo origin

Write-Step "Empujando a GitHub..."
git push -u origin $Branch
if ($LASTEXITCODE -ne 0) { Write-Fail "Push inicial fallido." }
Write-Ok "Workspace en GitHub."

Pop-Location

# 5. Registrar en workspaces.json

Write-Step "Registrando en workspaces.json..."
$newEntry = [PSCustomObject]@{
    name   = $Name
    path   = $wsRelPath
    branch = $Branch
}

$registry.workspaces += $newEntry
$registryJson = $registry | ConvertTo-Json -Depth 5
Write-Utf8NoBom $registryPath $registryJson
Write-Ok "Registrado en workspaces.json."

Write-Step "Revalidando registry..."
node $encodingGuard $registryPath
if ($LASTEXITCODE -ne 0) {
    Write-Fail "El registry quedo fuera de contrato despues de escribirlo."
}

# Resumen

Write-Host ""
Write-Host "-----------------------------------------" -ForegroundColor DarkGray
Write-Host "  Workspace '$Name' listo." -ForegroundColor Green
Write-Host "  GitHub:  $newOrigin" -ForegroundColor DarkGray
Write-Host "  Local:   $wsPath" -ForegroundColor DarkGray
Write-Host "  Rama:    $Branch" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Proximos pasos:" -ForegroundColor DarkGray
Write-Host "    1. Edita storage/ con la identidad del nuevo proyecto" -ForegroundColor DarkGray
Write-Host "    2. Corre: npm install; npm run dev" -ForegroundColor DarkGray
Write-Host "    3. Para recibir updates del engine: .\scripts\admin\sync-workspaces.ps1" -ForegroundColor DarkGray
Write-Host ""
