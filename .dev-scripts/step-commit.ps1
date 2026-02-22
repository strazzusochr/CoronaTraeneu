# ═══════════════════════════════════════════════════════════════
# STEP-COMMIT: Interaktiver Feature-Commit mit Safety & Metriken
# Projekt: Corona Control Ultimate
# Pfad:    C:\Users\immer\Desktop\corona-control-project
# ═══════════════════════════════════════════════════════════════

param(
    [Parameter(Mandatory = $false)][string]$StepNr,
    [Parameter(Mandatory = $false)][string]$FeatureName,
    [Parameter(Mandatory = $false)][string]$Category
)

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$AppDir = Join-Path $ProjectRoot "corona-control-ultimate"
$LogFile = Join-Path $ProjectRoot "trae.md"
$SafeTagFile = Join-Path $ProjectRoot "LAST_SAFE_TAG.txt"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$DateHuman = Get-Date -Format "dd.MM.yyyy HH:mm"

# ─── USAGE ───────────────────────────────────────────────────
if (-not $StepNr -or -not $FeatureName -or -not $Category) {
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  STEP-COMMIT: Feature-basierter Commit mit Safety" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\step-commit.ps1 <step-nr> <feature-name> <category>" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  step-nr:       Fortlaufende Nummer (01, 02, ...)"
    Write-Host "  feature-name:  Kurzer Name ohne Leerzeichen"
    Write-Host "  category:      graphics | system | ui | performance | bugfix"
    Write-Host ""
    Write-Host "Beispiel: .\step-commit.ps1 01 detailed-npc-head graphics" -ForegroundColor Green
    exit 1
}

$BranchName = "feature/step-${StepNr}-${FeatureName}"
$BackupBranch = "backup/${StepNr}-pre-${Timestamp}"

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  STEP-COMMIT: Step ${StepNr} - ${FeatureName}" -ForegroundColor Cyan
Write-Host "  Kategorie: ${Category}" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan

Set-Location $ProjectRoot

# ─── WARNUNG bei uncommitteten Aenderungen ────────────────────
$dirtyCheck = git status --porcelain
if ($dirtyCheck) {
    Write-Host ""
    Write-Host "  HINWEIS: Es gibt uncommittete Aenderungen!" -ForegroundColor Yellow
    Write-Host "  Diese werden im Backup-Branch mitgesichert." -ForegroundColor Yellow
}

# ─── SCHRITT 1: Pre-Change Backup ────────────────────────────
Write-Host ""
Write-Host "Schritt 1: Pre-Change Backup erstellen..." -ForegroundColor Yellow
git add -A 2>$null
git stash push -m "pre-step-${StepNr}-${Timestamp}" --include-untracked 2>$null
git branch $BackupBranch 2>$null
git stash pop 2>$null
Write-Host "  Backup-Branch erstellt: $BackupBranch" -ForegroundColor Green

# LAST_SAFE_TAG.txt aktualisieren
$lastTag = git describe --tags 2>$null
if ($lastTag) {
    "Last safe: $lastTag (vor Step ${StepNr})" | Set-Content $SafeTagFile
}

# ─── SCHRITT 2: Feature Branch ───────────────────────────────
Write-Host ""
Write-Host "Schritt 2: Feature-Branch erstellen..." -ForegroundColor Yellow
$CurrentBranch = git branch --show-current
if ($CurrentBranch -ne $BranchName) {
    $existingBranch = git branch --list $BranchName
    if ($existingBranch) {
        git checkout $BranchName 2>$null
    }
    else {
        git checkout -b $BranchName 2>$null
    }
}
Write-Host "  Auf Branch: $BranchName" -ForegroundColor Green

# ─── SCHRITT 3: Warten auf Implementierung ───────────────────
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  IMPLEMENTATION PHASE" -ForegroundColor Cyan
Write-Host "  Arbeite jetzt an deinem Code!" -ForegroundColor Cyan
Write-Host "  Druecke ENTER wenn du fertig bist." -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Read-Host

# ─── SCHRITT 4: Build Verification ───────────────────────────
Write-Host ""
Write-Host "Schritt 4: Build Verification..." -ForegroundColor Yellow
Set-Location $AppDir

# Erst TypeScript-Check (schneller)
Write-Host "  TypeScript-Check..." -ForegroundColor Yellow
$tsResult = & npx tsc --noEmit 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  TypeScript-Check FEHLGESCHLAGEN!" -ForegroundColor Red
    Write-Host "  $tsResult" -ForegroundColor Red
    Write-Host "  Dein Backup ist sicher auf: $BackupBranch" -ForegroundColor Yellow
    Write-Host "  Tipp: Fehler beheben und Script erneut starten." -ForegroundColor Yellow
    Set-Location $ProjectRoot
    exit 1
}
Write-Host "  TypeScript-Check bestanden!" -ForegroundColor Green

# Dann volles Build
Write-Host "  Vite Build..." -ForegroundColor Yellow
$buildResult = & npm run build 2>&1
if ($LASTEXITCODE -eq 0) {
    $BuildStatus = "ERFOLGREICH"
    Write-Host "  Build: $BuildStatus" -ForegroundColor Green
}
else {
    $BuildStatus = "FEHLGESCHLAGEN"
    Write-Host "  Build: $BuildStatus" -ForegroundColor Red
    Write-Host "  Build fehlgeschlagen! Bitte Fehler beheben." -ForegroundColor Red
    Write-Host "  Dein Backup ist sicher auf: $BackupBranch" -ForegroundColor Yellow
    Set-Location $ProjectRoot
    exit 1
}

Set-Location $ProjectRoot

# ─── SCHRITT 5: Metriken abfragen ────────────────────────────
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  METRIKEN (optional - einfach ENTER zum Ueberspringen)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan

$PolyCount = Read-Host "Polygon-Count"
$FpsValue = Read-Host "FPS-Wert"
$DrawCalls = Read-Host "Draw Calls"

if ([string]::IsNullOrWhiteSpace($PolyCount) -or $PolyCount -eq "skip") { $PolyCount = "n/a" }
if ([string]::IsNullOrWhiteSpace($FpsValue) -or $FpsValue -eq "skip") { $FpsValue = "n/a" }
if ([string]::IsNullOrWhiteSpace($DrawCalls) -or $DrawCalls -eq "skip") { $DrawCalls = "n/a" }

# ─── SCHRITT 6: Commit ───────────────────────────────────────
Write-Host ""
Write-Host "Schritt 6: Aenderungen committen..." -ForegroundColor Yellow
git add -A
$CommitMsg = "Step ${StepNr}: ${FeatureName} [${Category}] - Build: ${BuildStatus}"
$commitOutput = git commit -m $CommitMsg 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Keine neuen Aenderungen zum Committen." -ForegroundColor Yellow
}
else {
    Write-Host "  Commit erstellt!" -ForegroundColor Green
}

# Tag erstellen
$TagName = "safe-step-${StepNr}"
git tag -f $TagName -m "Step ${StepNr}: ${FeatureName} (${Category})"
Write-Host "  Tag erstellt: $TagName" -ForegroundColor Green

# ─── SCHRITT 7: Log in trae.md ───────────────────────────────
$logEntry = @"

## Step ${StepNr}: ${FeatureName}
- **Datum:** ${DateHuman}
- **Kategorie:** ${Category}
- **Branch:** ${BranchName}
- **Build:** ${BuildStatus}
- **Polygone:** ${PolyCount}
- **FPS:** ${FpsValue}
- **Draw Calls:** ${DrawCalls}
- **Backup:** ${BackupBranch}
- **Tag:** ${TagName}
"@
Add-Content -Path $LogFile -Value $logEntry -Encoding UTF8

# ─── SCHRITT 8: Push Optionen ────────────────────────────────
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  PUSH OPTIONEN" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  1) Feature-Branch zu HuggingFace pushen (TEST)"
Write-Host "  2) Merge zu main + HuggingFace Push (PRODUCTION)"
Write-Host "  3) Nur lokal committen (KEIN PUSH)"
Write-Host ""
$PushOption = Read-Host "Waehle Option [1/2/3]"

switch ($PushOption) {
    "1" {
        Write-Host "Pushe Feature-Branch zu HuggingFace..." -ForegroundColor Yellow
        git push hf "${BranchName}:${BranchName}" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Feature-Branch zu HuggingFace gepusht!" -ForegroundColor Green
        }
        else {
            # Fallback: origin
            git push origin $BranchName 2>$null
            Write-Host "  Feature-Branch zu origin gepusht!" -ForegroundColor Green
        }
    }
    "2" {
        Write-Host "Merge zu main und Push zu HuggingFace..." -ForegroundColor Yellow
        git checkout main
        git merge $BranchName -m "Merge Step ${StepNr}: ${FeatureName}"

        # Push zu HuggingFace
        git push hf main:main 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Zu main gemergt und zu HuggingFace gepusht!" -ForegroundColor Green
        }
        else {
            git push origin main 2>$null
            Write-Host "  Zu main gemergt und zu origin gepusht!" -ForegroundColor Green
        }

        # Tags pushen
        git push hf --tags 2>$null
        git push origin --tags 2>$null

        # HF Deployment-Tag
        $deployTag = "hf-deploy-$(Get-Date -Format 'yyyyMMdd')"
        git tag -f $deployTag -m "HF Deployment Step ${StepNr}"
        Write-Host "  Deployment-Tag: $deployTag" -ForegroundColor Green
    }
    default {
        Write-Host "  Nur lokal gespeichert. Kein Push." -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  STEP ${StepNr} ABGESCHLOSSEN!" -ForegroundColor Green
Write-Host "  Feature: ${FeatureName}" -ForegroundColor Green
Write-Host "  Tag:     ${TagName}" -ForegroundColor Green
Write-Host "  Backup:  ${BackupBranch}" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
