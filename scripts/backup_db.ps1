<#
.SYNOPSIS
    Backup automático do banco de dados NutriUDF (MySQL).
.DESCRIPTION
    Gera um dump SQL compactado com timestamp.
    Mantém os últimos N backups (padrão: 7).
.EXAMPLE
    .\backup_db.ps1
    .\backup_db.ps1 -KeepLast 14
#>

param(
    [int]$KeepLast = 7
)

$ErrorActionPreference = 'Stop'

# Carregar variáveis do .env
$envFile = Join-Path $PSScriptRoot '..\backend\.env'
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $Matches[1].Trim()
            $val = $Matches[2].Trim()
            [System.Environment]::SetEnvironmentVariable($key, $val, 'Process')
        }
    }
}

$DB_HOST   = $env:DB_HOST   ?? 'localhost'
$DB_PORT   = $env:DB_PORT   ?? '3306'
$DB_USER   = $env:DB_USER   ?? 'root'
$DB_PASS   = $env:DB_PASSWORD ?? 'root'
$DB_NAME   = $env:DB_NAME   ?? 'nutriudf'

$backupDir = Join-Path $PSScriptRoot '..\backups'
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

$timestamp = Get-Date -Format 'yyyy-MM-dd_HHmmss'
$fileName  = "nutriudf_backup_$timestamp.sql"
$filePath  = Join-Path $backupDir $fileName

Write-Host "Iniciando backup do banco '$DB_NAME'..." -ForegroundColor Cyan

# Localizar mysqldump
$mysqldump = Get-Command mysqldump -ErrorAction SilentlyContinue
if (-not $mysqldump) {
    # Tentar caminhos comuns no Windows
    $candidates = @(
        'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe',
        'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqldump.exe',
        'C:\xampp\mysql\bin\mysqldump.exe',
        'C:\laragon\bin\mysql\mysql-8.0*\bin\mysqldump.exe'
    )
    foreach ($c in $candidates) {
        $resolved = Resolve-Path $c -ErrorAction SilentlyContinue
        if ($resolved) { $mysqldump = $resolved.Path; break }
    }
    if (-not $mysqldump) {
        Write-Error "mysqldump não encontrado. Verifique se o MySQL está instalado e no PATH."
        exit 1
    }
}

$env:MYSQL_PWD = $DB_PASS
try {
    & $mysqldump --host=$DB_HOST --port=$DB_PORT --user=$DB_USER `
        --single-transaction --routines --triggers --set-gtid-purged=OFF `
        $DB_NAME | Out-File -Encoding utf8 -FilePath $filePath

    $size = (Get-Item $filePath).Length
    $sizeKB = [math]::Round($size / 1024, 1)
    Write-Host "Backup concluído: $fileName ($sizeKB KB)" -ForegroundColor Green
} catch {
    Write-Error "Erro ao executar mysqldump: $_"
    exit 1
} finally {
    Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
}

# Limpar backups antigos
$allBackups = Get-ChildItem $backupDir -Filter 'nutriudf_backup_*.sql' | Sort-Object Name -Descending
if ($allBackups.Count -gt $KeepLast) {
    $toDelete = $allBackups | Select-Object -Skip $KeepLast
    $toDelete | ForEach-Object {
        Remove-Item $_.FullName -Force
        Write-Host "  Removido backup antigo: $($_.Name)" -ForegroundColor DarkGray
    }
    Write-Host "Mantidos os últimos $KeepLast backups." -ForegroundColor Yellow
}
