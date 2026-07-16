$body = @{
    zap = "exportar_propuesta_pdf"
    payload = @{
        record = @{
            id = "286b5b77-89e8-4c9a-88cb-f1e52589f87f"
        }
    }
} | ConvertTo-Json -Depth 3

try {
    $response = Invoke-WebRequest -Uri "https://vetadorada.netlify.app/api/engine" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 60 -ErrorAction Stop
    Write-Host "Status: $($response.StatusCode)"
    Write-Host $response.Content
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Status: $statusCode"
    try {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $body = $reader.ReadToEnd()
        Write-Host "Body: $body"
    } catch {
        Write-Host "Error reading body: $_"
    }
}
