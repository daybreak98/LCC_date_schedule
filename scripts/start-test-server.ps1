$ErrorActionPreference = "Stop"

$python = Join-Path $env:LocalAppData "Programs\Python\Python314\python.exe"
if (-not (Test-Path $python)) {
  $python = "python"
}

& $python app.py
