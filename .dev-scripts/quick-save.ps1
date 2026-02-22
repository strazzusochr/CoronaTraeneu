# ═══════════════════════════════════════════════════════════════
# QUICK-SAVE: Schneller Commit + Build-Check fuer kleine Aenderungen
# Projekt: Corona Control Ultimate
# Pfad:    C:\Users\immer\Desktop\corona-control-project
# ═══════════════════════════════════════════════════════════════

param(
    [Parameter(Mandatory = $false)][string]$SaveNr,
    [Parameter(Mandatory = $false)][string]$Description
)

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$AppDir = Join-Path $ProjectRoot "corona-control-ultimate"
$LogFile = Join-Path $ProjectRoot "trae.md"
$SafeTagFile = Join-Path $ProjectRoot "LAST_SAFE_TAG.txt"
$DateHuman = Get-Date -Format "dd.MM.yyyy HH:mm"

# ─── USAGE ───────────────────────────────────────────────────
if (-not $SaveNr -or -not $Description) {
    Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  QUICK-SAVE: Schneller Commit + Build" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host 'Usage: .\quick-save.ps1 <nr> "beschreibung"' -ForegroundColor Yellow
    Write-Host ""
    Write-Host 'Beispiel: .\quick-save.ps1 10 "Fixed NPC color rendering"' -ForegroundColor Green
    exit 1
}

$TagName = "quick-save-${SaveNr}"

Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  QUICK-SAVE #${SaveNr}" -ForegroundColor Cyan
Write-Host "  ${Description}" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan

Set-Location $ProjectRoot

# ─── Pruefe ob es Aenderungen gibt ───────────────────────────
$changes = git status --porcelain
if (-not $changes) {
    Write-Host ""
    Write-Host "  Keine Aenderungen gefunden. Nichts zu speichern." -ForegroundColor Yellow
    exit 0
}

$changedFiles = ($changes | Measure-Object).Count
Write-Host ""
Write-Host "  $changedFiles geaenderte Datei(en) gefunden." -ForegroundColor Cyan

# ─── Build-Check ─────────────────────────────────────────────
Write-Host ""
Write-Host "Build-Check..." -ForegroundColor Yellow
Set-Location $AppDir

$buildResult = & npm run build 2>&1
if ($LASTEXITCODE -eq 0) {
    $BuildStatus = "ERFOLGREICH"
    Write-Host "  Build: $BuildStatus" -ForegroundColor Green
}
else {
    $BuildStatus = "FEHLGESCHLAGEN"
    Write-Host "  Build: $BuildStatus" -ForegroundColor Red
    Write-Host "  Build fehlgeschlagen! Commit wird abgebrochen." -ForegroundColor Red
    Write-Host "  Tipp: Fehler beheben und erneut versuchen." -ForegroundColor Yellow
    Write-Host "  Oder: git commit --no-verify (um Check zu umgehen)" -ForegroundColor Yellow
    Set-Location $ProjectRoot
    exit 1
}

Set-Location $ProjectRoot

# ─── Commit ──────────────────────────────────────────────────
Write-Host ""
Write-Host "Speichere..." -ForegroundColor Yellow
git add -A
$CommitMsg = "Quick-Save #${SaveNr}: ${Description}"
$commitOutput = git commit -m $CommitMsg 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Keine neuen Aenderungen zum Committen." -ForegroundColor Yellow
}
else {
    Write-Host "  Commit erstellt!" -ForegroundColor Green
}

# Tag
git tag -f $TagName -m "Quick-Save #${SaveNr}: ${Description}"

# LAST_SAFE_TAG aktualisieren
"Last safe: $TagName ($DateHuman)" | Set-Content $SafeTagFile

# ─── Log ─────────────────────────────────────────────────────
$logEntry = @"

### Quick-Save #${SaveNr}
- **Datum:** ${DateHuman}
- **Beschreibung:** ${Description}
- **Build:** ${BuildStatus}
- **Tag:** ${TagName}
- **Dateien:** ${changedFiles} geaendert
"@
Add-Content -Path $LogFile -Value $logEntry -Encoding UTF8

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host "  Quick-Save #${SaveNr} gesichert!" -ForegroundColor Green
Write-Host "  Tag: ${TagName}" -ForegroundColor Green
Write-Host "  Dateien: ${changedFiles}" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
