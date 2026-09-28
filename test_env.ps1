$py313 = "C:\Program Files\Python313\python.exe"
$py312 = "C:\Users\HP\AppData\Local\Programs\Python\Python312\python.exe"

Write-Host "Testing Python 313:"
if (Test-Path $py313) {
    & $py313 -c "import sys; print(sys.version)"
}

Write-Host "Testing Python 312:"
if (Test-Path $py312) {
    & $py312 -c "import sys; print(sys.version)"
}
