<#
.SYNOPSIS
  Validates the RIMSS static (CSR) deployment artifact and optionally smoke-tests it over HTTP.

.DESCRIPTION
  Used by the Jenkins pipeline after deploying dist/rimss/browser to the IIS site directory.
  Fails (non-zero exit) if the deployed entry document or main bundle is missing, or if the
  live site returns HTML for a JS request (the SPA fallback masking a missing/misrouted asset).
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$DeployDir,

    [string]$SiteUrl = 'http://localhost:8085',

    [string]$CatalogRoute = '/catalog',

    [bool]$RunHttpSmokeTest = $true
)

$ErrorActionPreference = 'Stop'

function Fail([string]$message) {
    Write-Host "ERROR: $message" -ForegroundColor Red
    exit 1
}

function Test-HtmlBody([string]$body) {
    return $body -match '^\s*<!doctype html|^\s*<html'
}

Write-Host '====================================='
Write-Host 'RIMSS DEPLOYMENT VERIFICATION'
Write-Host '====================================='
Write-Host "Deployment directory: $DeployDir"

if (-not (Test-Path $DeployDir)) {
    Fail "Deployment directory not found: $DeployDir"
}

# --- Artifact validation (mandatory) ---

$csrPath = Join-Path $DeployDir 'index.csr.html'
$indexPath = Join-Path $DeployDir 'index.html'

if (Test-Path $indexPath) {
    $indexSource = if (Test-Path $csrPath) { 'index.csr.html (copied to index.html by Jenkins)' } else { 'index.html (produced directly by Angular)' }
} else {
    $indexSource = 'MISSING'
}
Write-Host "Selected index source: $indexSource"

if (-not (Test-Path $indexPath)) {
    Fail "Deployed index.html not found at: $indexPath"
}
Write-Host "Deployed index path: $indexPath"

$mainJsFiles = Get-ChildItem -Path $DeployDir -Filter 'main-*.js' -File -ErrorAction SilentlyContinue
if (-not $mainJsFiles -or $mainJsFiles.Count -eq 0) {
    Fail "No main-*.js bundle found in $DeployDir"
}

$mainJs = $mainJsFiles | Select-Object -First 1
Write-Host "Detected main JS filename: $($mainJs.Name)"

$allJsFiles = Get-ChildItem -Path $DeployDir -Filter '*.js' -File -ErrorAction SilentlyContinue
Write-Host 'Deployed JS files:'
$allJsFiles | ForEach-Object { Write-Host "  $($_.Name)" }

Write-Host 'Artifact validation passed.'

if (-not $RunHttpSmokeTest) {
    Write-Host 'HTTP smoke test skipped (RunHttpSmokeTest = false).'
    exit 0
}

# --- HTTP smoke tests (conditional) ---

Write-Host '====================================='
Write-Host 'HTTP SMOKE TESTS'
Write-Host "Site: $SiteUrl"
Write-Host '====================================='

try {
    $rootResponse = Invoke-WebRequest -Uri $SiteUrl -UseBasicParsing -TimeoutSec 15
} catch {
    Fail "Root request to $SiteUrl failed: $($_.Exception.Message)"
}
if ($rootResponse.StatusCode -lt 200 -or $rootResponse.StatusCode -ge 400) {
    Fail "Root request to $SiteUrl returned HTTP $($rootResponse.StatusCode)"
}
Write-Host "Root request OK: HTTP $($rootResponse.StatusCode)"

$jsUrl = "$($SiteUrl.TrimEnd('/'))/$($mainJs.Name)"
try {
    $jsResponse = Invoke-WebRequest -Uri $jsUrl -UseBasicParsing -TimeoutSec 15
} catch {
    Fail "Request to main bundle $jsUrl failed: $($_.Exception.Message)"
}
if ($jsResponse.StatusCode -lt 200 -or $jsResponse.StatusCode -ge 400) {
    Fail "Main bundle request $jsUrl returned HTTP $($jsResponse.StatusCode)"
}

$jsContentType = [string]$jsResponse.Headers['Content-Type']
if ($jsContentType -match 'text/html') {
    Fail "Main bundle $jsUrl was served with Content-Type '$jsContentType' (SPA fallback is masking a missing/misrouted asset)."
}
if ($jsContentType -notmatch 'javascript') {
    Fail "Main bundle $jsUrl was served with unexpected Content-Type '$jsContentType' (expected application/javascript or text/javascript)."
}
if (Test-HtmlBody $jsResponse.Content) {
    Fail "Main bundle $jsUrl response body looks like HTML, not JavaScript."
}
Write-Host "Main bundle OK: HTTP $($jsResponse.StatusCode), Content-Type: $jsContentType"

$routeUrl = "$($SiteUrl.TrimEnd('/'))$CatalogRoute"
try {
    $routeResponse = Invoke-WebRequest -Uri $routeUrl -UseBasicParsing -TimeoutSec 15
} catch {
    Fail "Angular route request $routeUrl failed: $($_.Exception.Message)"
}
if ($routeResponse.StatusCode -lt 200 -or $routeResponse.StatusCode -ge 400) {
    Fail "Angular route request $routeUrl returned HTTP $($routeResponse.StatusCode)"
}
Write-Host "Angular route OK ($routeUrl): HTTP $($routeResponse.StatusCode)"

Write-Host '====================================='
Write-Host 'HTTP SMOKE TESTS PASSED'
Write-Host '====================================='
exit 0
