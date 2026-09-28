# Script de ejecución para Windows PowerShell
if (Get-Command py -ErrorAction SilentlyContinue) {
    py run_graphify.py
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    python run_graphify.py
} elseif (Get-Command node -ErrorAction SilentlyContinue) {
    node build_graph.js
} else {
    Write-Host "No se encontró Python o Node instalados en tu sistema." -ForegroundColor Red
}
