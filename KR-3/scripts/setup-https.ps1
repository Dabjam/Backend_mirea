$projectRoot = Split-Path -Parent $PSScriptRoot
$pfxPath = Join-Path $projectRoot "localhost.pfx"
$cerPath = Join-Path $projectRoot "localhost.cer"
$passwordPath = Join-Path $projectRoot "localhost-passphrase.txt"
$friendlyName = "KR-3 Local HTTPS"
$passwordPlain = "kr3-localhost"
$password = ConvertTo-SecureString -String $passwordPlain -AsPlainText -Force

$existingCert = Get-ChildItem Cert:\CurrentUser\My |
  Where-Object { $_.FriendlyName -eq $friendlyName } |
  Sort-Object NotAfter -Descending |
  Select-Object -First 1

if (-not $existingCert) {
  $existingCert = New-SelfSignedCertificate `
    -DnsName "localhost" `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -FriendlyName $friendlyName `
    -NotAfter (Get-Date).AddYears(3) `
    -KeyAlgorithm RSA `
    -KeyLength 2048 `
    -HashAlgorithm SHA256
}

Export-PfxCertificate `
  -Cert "Cert:\CurrentUser\My\$($existingCert.Thumbprint)" `
  -FilePath $pfxPath `
  -Password $password | Out-Null

Export-Certificate `
  -Cert "Cert:\CurrentUser\My\$($existingCert.Thumbprint)" `
  -FilePath $cerPath `
  -Type CERT | Out-Null

$trustedCert = Get-ChildItem Cert:\CurrentUser\Root |
  Where-Object { $_.Thumbprint -eq $existingCert.Thumbprint } |
  Select-Object -First 1

if (-not $trustedCert) {
  Import-Certificate -FilePath $cerPath -CertStoreLocation "Cert:\CurrentUser\Root" | Out-Null
}

Set-Content -Path $passwordPath -Value $passwordPlain -NoNewline

Write-Host "HTTPS certificate is ready:"
Write-Host "  PFX: $pfxPath"
Write-Host "  CER: $cerPath"
