# ═══════════════════════════════════════════════════════════════
# EMERGENCY-BACKUP: Sofortiger Sicherungspunkt (kein Build-Check)
# Projekt: Corona Control Ultimate
# Pfad:    C:\Users\immer\Desktop\corona-control-project
# ═══════════════════════════════════════════════════════════════

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$LogFile = Join-Path $ProjectRoot "trae.md"
$SafeTagFile = Join-Path $ProjectRoot "LAST_SAFE_TAG.txt"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$DateHuman = Get-Date -Format "dd.MM.yyyy HH:mm"

$BackupBranch = "emergency-backup-${Timestamp}"
$BackupTag = "emergency-${Timestamp}"

Write-Host "═══════════════════════════════════════════" -ForegroundColor Red
Write-Host "  NOTFALL-BACKUP WIRD ERSTELLT" -ForegroundColor Red
Write-Host "═══════════════════════════════════════════" -ForegroundColor Red

Set-Location $ProjectRoot

# Zeige was gesichert wird
$changes = git status --porcelain
if ($changes) {
    $changedFiles = ($changes | Measure-Object).Count
    Write-Host ""
    Write-Host "  $changedFiles uncommittete Datei(en) werden gesichert." -ForegroundColor Yellow
}
else {
    Write-Host ""
    Write-Host "  Arbeitsverzeichnis ist sauber." -ForegroundColor Cyan
}

# Alles stagen
git add -A 2>$null

# Stash erstellen (sichert uncommitted changes)
$StashMsg = "emergency-stash-${Timestamp}"
git stash push -m $StashMsg --include-untracked 2>$null

# Backup-Branch vom aktuellen HEAD
git branch $BackupBranch 2>$null

# Tag
git tag $BackupTag -m "EMERGENCY BACKUP - ${DateHuman}" 2>$null

# Stash wieder anwenden (Arbeit geht weiter wie vorher)
git stash pop 2>$null

# LAST_SAFE_TAG.txt aktualisieren
"Last safe: $BackupTag ($DateHuman) - EMERGENCY" | Set-Content $SafeTagFile

# Log
$logEntry = @"

### EMERGENCY BACKUP
- **Datum:** ${DateHuman}
- **Branch:** ${BackupBranch}
- **Tag:** ${BackupTag}
- **Uncommitted:** $(if ($changes) { "$changedFiles Dateien" } else { "keine" })
"@
Add-Content -Path $LogFile -Value $logEntry -Encoding UTF8

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host "  Notfall-Backup erstellt!" -ForegroundColor Green
Write-Host "  Branch: ${BackupBranch}" -ForegroundColor Green
Write-Host "  Tag:    ${BackupTag}" -ForegroundColor Green
Write-Host "" -ForegroundColor Green
Write-Host "  Rollback jederzeit mit:" -ForegroundColor Green
Write-Host "  .\.dev-scripts\rollback.ps1" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
