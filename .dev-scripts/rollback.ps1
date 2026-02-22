# ═══════════════════════════════════════════════════════════════
# ROLLBACK: Interaktives Zuruecksetzen auf Backup-Punkt
# Projekt: Corona Control Ultimate
# Pfad:    C:\Users\immer\Desktop\corona-control-project
# ═══════════════════════════════════════════════════════════════

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$LogFile = Join-Path $ProjectRoot "trae.md"
$SafeTagFile = Join-Path $ProjectRoot "LAST_SAFE_TAG.txt"
$DateHuman = Get-Date -Format "dd.MM.yyyy HH:mm"

Set-Location $ProjectRoot

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ROLLBACK - Sicherungspunkte" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Zeige LAST_SAFE_TAG wenn vorhanden
if (Test-Path $SafeTagFile) {
    $lastSafe = Get-Content $SafeTagFile
    Write-Host "  Letzter sicherer Stand: $lastSafe" -ForegroundColor Green
    Write-Host ""
}

# ─── Backup-Branches und Tags auflisten ──────────────────────
Write-Host "Verfuegbare Sicherungspunkte:" -ForegroundColor Yellow
Write-Host ""

# Nummerierte Liste fuer einfache Auswahl
$allPoints = @()
$counter = 1

Write-Host "── EMERGENCY BACKUPS ──" -ForegroundColor Cyan
$emergencyBranches = @(git branch --list "emergency-backup-*" 2>$null | ForEach-Object { $_.Trim() } | Where-Object { $_ })
foreach ($b in $emergencyBranches) {
    Write-Host "  [$counter] $b" -ForegroundColor White
    $allPoints += $b
    $counter++
}
if ($emergencyBranches.Count -eq 0) { Write-Host "  (keine)" }

Write-Host ""
Write-Host "── BACKUP BRANCHES ──" -ForegroundColor Cyan
$backupBranches = @(git branch --list "backup/*" 2>$null | ForEach-Object { $_.Trim() } | Where-Object { $_ })
foreach ($b in $backupBranches) {
    Write-Host "  [$counter] $b" -ForegroundColor White
    $allPoints += $b
    $counter++
}
if ($backupBranches.Count -eq 0) { Write-Host "  (keine)" }

Write-Host ""
Write-Host "── SAFE-STEP TAGS ──" -ForegroundColor Cyan
$safeTags = @(git tag -l "safe-step-*" 2>$null | Where-Object { $_ })
foreach ($t in $safeTags) {
    Write-Host "  [$counter] $t" -ForegroundColor White
    $allPoints += $t
    $counter++
}
if ($safeTags.Count -eq 0) { Write-Host "  (keine)" }

Write-Host ""
Write-Host "── QUICK-SAVE TAGS ──" -ForegroundColor Cyan
$quickTags = @(git tag -l "quick-save-*" 2>$null | Where-Object { $_ })
foreach ($t in $quickTags) {
    Write-Host "  [$counter] $t" -ForegroundColor White
    $allPoints += $t
    $counter++
}
if ($quickTags.Count -eq 0) { Write-Host "  (keine)" }

Write-Host ""
Write-Host "── EMERGENCY TAGS ──" -ForegroundColor Cyan
$emergencyTags = @(git tag -l "emergency-*" 2>$null | Where-Object { $_ })
foreach ($t in $emergencyTags) {
    Write-Host "  [$counter] $t" -ForegroundColor White
    $allPoints += $t
    $counter++
}
if ($emergencyTags.Count -eq 0) { Write-Host "  (keine)" }

Write-Host ""

if ($allPoints.Count -eq 0) {
    Write-Host "Keine Sicherungspunkte vorhanden." -ForegroundColor Yellow
    exit 0
}

# ─── Auswahl (Nummer oder Name) ──────────────────────────────
$input = Read-Host "Gib die Nummer oder den Namen ein (oder 'q' zum Abbrechen)"

if ($input -eq "q" -or [string]::IsNullOrEmpty($input)) {
    Write-Host "Abgebrochen. Keine Aenderungen." -ForegroundColor Green
    exit 0
}

# Nummer oder Name?
if ($input -match '^\d+$') {
    $idx = [int]$input - 1
    if ($idx -ge 0 -and $idx -lt $allPoints.Count) {
        $Target = $allPoints[$idx]
    }
    else {
        Write-Host "  Ungueltige Nummer!" -ForegroundColor Red
        exit 1
    }
}
else {
    $Target = $input
}

Write-Host ""
Write-Host "  Ausgewaehlt: $Target" -ForegroundColor Cyan

# ─── Bestaetigung ────────────────────────────────────────────
Write-Host ""
Write-Host "WARNUNG: Dies setzt dein Projekt auf '$Target' zurueck!" -ForegroundColor Red
Write-Host "Alle uncommitteten Aenderungen gehen verloren!" -ForegroundColor Red
Write-Host ""
$Confirm = Read-Host "Bist du sicher? (ja/nein)"

if ($Confirm -ne "ja") {
    Write-Host "Abgebrochen. Keine Aenderungen." -ForegroundColor Green
    exit 0
}

# ─── Emergency-Backup vor Rollback ───────────────────────────
Write-Host ""
Write-Host "Erstelle Sicherung des aktuellen Stands vor Rollback..." -ForegroundColor Yellow
$RollbackTimestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$PreRollback = "pre-rollback-${RollbackTimestamp}"
git add -A 2>$null
git stash push -m $PreRollback --include-untracked 2>$null
git branch $PreRollback 2>$null
git stash pop 2>$null
Write-Host "  Pre-Rollback gesichert: $PreRollback" -ForegroundColor Green

# ─── Rollback ausfuehren ────────────────────────────────────
Write-Host ""
Write-Host "Rollback zu: ${Target}..." -ForegroundColor Yellow

# Pruefe ob Tag
$isTag = git rev-parse "refs/tags/$Target" 2>$null
if ($LASTEXITCODE -eq 0) {
    git checkout main 2>$null
    git reset --hard $Target
    Write-Host "  Rollback auf Tag '$Target' erfolgreich!" -ForegroundColor Green
}
else {
    # Pruefe ob Branch
    $isBranch = git rev-parse "refs/heads/$Target" 2>$null
    if ($LASTEXITCODE -eq 0) {
        git checkout $Target
        Write-Host "  Gewechselt zu Branch '$Target'!" -ForegroundColor Green
    }
    else {
        Write-Host "  '$Target' nicht gefunden! Nutze exakte Namen aus der Liste." -ForegroundColor Red
        exit 1
    }
}

# Log
$logEntry = @"

### ROLLBACK
- **Datum:** ${DateHuman}
- **Ziel:** ${Target}
- **Pre-Rollback Branch:** ${PreRollback}
"@
Add-Content -Path $LogFile -Value $logEntry -Encoding UTF8

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  Rollback abgeschlossen!" -ForegroundColor Green
Write-Host "  Aktueller Stand: ${Target}" -ForegroundColor Green
Write-Host "  Pre-Rollback:    ${PreRollback}" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
