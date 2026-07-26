# Script to clean up all added eslint-disable-next-line comments
$actionsDir = "d:\concrete-plant-system\app\actions"
$files = Get-ChildItem -Path $actionsDir -Filter "*.ts" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    # Remove any occurrences of the added comment
    # Let's be precise and only remove comments that were added
    # We can match: [indent]// eslint-disable-next-line @typescript-eslint/no-explicit-any\r?\n
    # and replace with empty string.
    
    $newContent = $content -replace '(?m)^\s*// eslint-disable-next-line @typescript-eslint/no-explicit-any\r?\n', ''
    
    if ($newContent -ne $content) {
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        Write-Host "Cleaned up: $($file.Name)"
    }
}
