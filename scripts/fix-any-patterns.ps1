# Fix common 'as any' patterns in app/actions/**/*.ts
# Pattern 1: (user.role as any).name or (user.role as any)?.name -> role extraction
# Pattern 2: (c: any) in .map callbacks -> remove type annotation
# Pattern 3: data: any in function params -> Record<string, unknown>

$actionsDir = "d:\concrete-plant-system\app\actions"

# Get all .ts files recursively
$files = Get-ChildItem -Path $actionsDir -Filter "*.ts" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $modified = $false

    # Pattern 1: Replace role extraction pattern
    # typeof user.role === "string" ? user.role : (user.role as any).name
    # -> typeof user.role === "string" ? user.role : (user.role as { name: string }).name
    $pattern1 = '\(user\.role as any\)\.name'
    if ($content -match [regex]::Escape('(user.role as any).name')) {
        $content = $content -replace [regex]::Escape('(user.role as any).name'), '(user.role as { name: string }).name'
        $modified = $true
    }
    if ($content -match [regex]::Escape('(user.role as any)?.name')) {
        $content = $content -replace [regex]::Escape('(user.role as any)?.name'), '(user.role as { name: string })?.name'
        $modified = $true
    }

    # Pattern 2: (role as any) -> (role as { name: string })
    if ($content -match '\(role as any\)') {
        $content = $content -replace '\(role as any\)', '(role as { name: string })'
        $modified = $true
    }

    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($file.Name)"
    }
}

Write-Host "`nDone!"
