$loginUrl = "http://127.0.0.1:3001/api/auth/login"
$uploadUrl = "http://127.0.0.1:3001/api/posts"
$username = "verified_user"
$password = "password123"

# Login
$loginBody = @{
    username = $username
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "Login Successful. Token: $token"

    # Upload
    $boundary = [System.Guid]::NewGuid().ToString()
    $LF = "`r`n"
    
    $fileBytes = [System.IO.File]::ReadAllBytes("test_image.png")
    $fileEnc = [System.Text.Encoding]::GetEncoding('iso-8859-1').GetString($fileBytes)
    
    $bodyLines = (
        "--$boundary",
        "Content-Disposition: form-data; name=`"caption`"",
        "",
        "Test Caption",
        "--$boundary",
        "Content-Disposition: form-data; name=`"file`"; filename=`"test_image.png`"",
        "Content-Type: image/png",
        "",
        "$fileEnc",
        "--$boundary--"
    ) -join $LF

    $response = Invoke-WebRequest -Uri $uploadUrl -Method Post -Headers @{ "Authorization" = "Bearer $token" } -ContentType "multipart/form-data; boundary=$boundary" -Body $bodyLines
    Write-Host "Upload Status: $($response.StatusCode)"
    Write-Host "Upload Body: $($response.Content)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}
