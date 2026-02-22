# ═══════════════════════════════════════════════════════════════
# CLEANUP: Woechentliche Bereinigung alter Backup-Branches
# Projekt: Corona Control Ultimate
# Pfad:    C:\Users\immer\Desktop\corona-control-project
# ═══════════════════════════════════════════════════════════════

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$LogFile = Join-Path $ProjectRoot "trae.md"

Set-Location $ProjectRoot

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  CLEANUP - Woechentliche Bereinigung" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ─── STATISTIK ───────────────────────────────────────────────
$emergencyBranches = @(git branch --list "emergency-backup-*" 2>$null | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$backupBranches = @(git branch --list "backup/*" 2>$null | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$featureBranches = @(git branch --list "feature/*" 2>$null | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$preRollbackBranches = @(git branch --list "pre-rollback-*" 2>$null | ForEach-Object { $_.Trim() } | Where-Object { $_ })

Write-Host "Branch-Statistik:" -ForegroundColor Cyan
Write-Host "  Emergency Backups:  $($emergencyBranches.Count)"
Write-Host "  Backup Branches:    $($backupBranches.Count)"
Write-Host "  Feature Branches:   $($featureBranches.Count)"
Write-Host "  Pre-Rollback:       $($preRollbackBranches.Count)"
Write-Host ""

# Zeige Metriken-Zusammenfassung aus trae.md
if (Test-Path $LogFile) {
    $polyLines = Select-String -Path $LogFile -Pattern "Polygone:" -SimpleMatch 2>$null
    $fpsLines = Select-String -Path $LogFile -Pattern "FPS:" -SimpleMatch 2>$null
    if ($polyLines -or $fpsLines) {
        Write-Host "Letzte Metriken aus trae.md:" -ForegroundColor Cyan
        if ($polyLines) {
            $lastPoly = ($polyLines | Select-Object -Last 3).Line
            $lastPoly | ForEach-Object { Write-Host "  $_" }
        }
        if ($fpsLines) {
            $lastFps = ($fpsLines | Select-Object -Last 3).Line
            $lastFps | ForEach-Object { Write-Host "  $_" }
        }
        Write-Host ""
    }
}

$Total = $emergencyBranches.Count + $backupBranches.Count + $preRollbackBranches.Count
if ($Total -eq 0 -and $featureBranches.Count -eq 0) {
    Write-Host "Alles sauber! Keine alten Branches zum Loeschen." -ForegroundColor Green
    exit 0
}

# ─── EMERGENCY BACKUPS ───────────────────────────────────────
if ($emergencyBranches.Count -gt 0) {
    Write-Host "Emergency-Backup Branches ($($emergencyBranches.Count)):" -ForegroundColor Yellow
    $emergencyBranches | ForEach-Object { Write-Host "  $_" }
    Write-Host ""
    $del = Read-Host "Alte Emergency-Backups loeschen? (ja/nein)"
    if ($del -eq "ja") {
        $emergencyBranches | ForEach-Object { git branch -D $_ 2>$null }
        Write-Host "  Emergency-Backups geloescht." -ForegroundColor Green
    }
    Write-Host ""
}

# ─── BACKUP BRANCHES ────────────────────────────────────────
if ($backupBranches.Count -gt 0) {
    Write-Host "Backup Branches ($($backupBranches.Count)):" -ForegroundColor Yellow
    $backupBranches | ForEach-Object { Write-Host "  $_" }
    Write-Host ""
    $del = Read-Host "Alte Backup-Branches loeschen? (ja/nein)"
    if ($del -eq "ja") {
        $backupBranches | ForEach-Object { git branch -D $_ 2>$null }
        Write-Host "  Backup-Branches geloescht." -ForegroundColor Green
    }
    Write-Host ""
}

# ─── PRE-ROLLBACK ───────────────────────────────────────────
if ($preRollbackBranches.Count -gt 0) {
    Write-Host "Pre-Rollback Branches ($($preRollbackBranches.Count)):" -ForegroundColor Yellow
    $preRollbackBranches | ForEach-Object { Write-Host "  $_" }
    Write-Host ""
    $del = Read-Host "Pre-Rollback Branches loeschen? (ja/nein)"
    if ($del -eq "ja") {
        $preRollbackBranches | ForEach-Object { git branch -D $_ 2>$null }
        Write-Host "  Pre-Rollback Branches geloescht." -ForegroundColor Green
    }
    Write-Host ""
}

# ─── GEMERGTE FEATURE BRANCHES ──────────────────────────────
if ($featureBranches.Count -gt 0) {
    Write-Host "Feature Branches ($($featureBranches.Count)):" -ForegroundColor Yellow
    $featureBranches | ForEach-Object { Write-Host "  $_" }
    Write-Host ""

    $mergedFeatures = @(git branch --merged main --list "feature/*" 2>$null | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    if ($mergedFeatures.Count -gt 0) {
        Write-Host "Davon $($mergedFeatures.Count) bereits in main gemergt." -ForegroundColor Cyan
        $del = Read-Host "Gemergte Feature-Branches loeschen? (ja/nein)"
        if ($del -eq "ja") {
            $mergedFeatures | ForEach-Object { git branch -D $_ 2>$null }
            Write-Host "  Gemergte Feature-Branches geloescht." -ForegroundColor Green
        }
    }
    else {
        Write-Host "Keine gemergten Feature-Branches gefunden." -ForegroundColor Cyan
    }
    Write-Host ""
}

# ─── ZUSAMMENFASSUNG ─────────────────────────────────────────
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  Cleanup abgeschlossen!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Verbleibende Branches:" -ForegroundColor Cyan
git branch
Write-Host ""
Write-Host "Wichtige Tags (Milestones + Safe-Steps):" -ForegroundColor Cyan
$milestones = git tag -l "milestone-*" 2>$null
$safeSteps = git tag -l "safe-step-*" 2>$null
$hfDeploys = git tag -l "hf-deploy-*" 2>$null
if ($milestones) { $milestones | ForEach-Object { Write-Host "  $_" -ForegroundColor Green } }
if ($safeSteps) { $safeSteps | ForEach-Object { Write-Host "  $_" -ForegroundColor Cyan } }
if ($hfDeploys) { $hfDeploys | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow } }
if (-not $milestones -and -not $safeSteps -and -not $hfDeploys) { Write-Host "  (keine)" }
