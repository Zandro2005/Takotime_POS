// scripts/generate-icons.js
// Generates multi-resolution icon.ico and icon.png for Windows packaging

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const srcLogo = path.join(rootDir, 'renderer', 'assets', 'logo.png');
const buildDir = path.join(rootDir, 'build');
const destIco = path.join(buildDir, 'icon.ico');
const destPng = path.join(buildDir, 'icon.png');

if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Copy source logo to build/icon.png
fs.copyFileSync(srcLogo, destPng);

// Generate multi-resolution icon.ico using PowerShell .NET System.Drawing
const psScript = `
$srcPath = "${srcLogo.replace(/\\/g, '\\\\')}"
$icoPath = "${destIco.replace(/\\/g, '\\\\')}"

Add-Type -AssemblyName System.Drawing

$srcBmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$sizes = @(256, 128, 64, 48, 32, 16)
$pngDataList = @()

foreach ($s in $sizes) {
    $targetBmp = New-Object System.Drawing.Bitmap($s, $s, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($targetBmp)
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($srcBmp, 0, 0, $s, $s)
    $g.Dispose()

    $ms = New-Object System.IO.MemoryStream
    $targetBmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $targetBmp.Dispose()
    $pngDataList += ,($ms.ToArray())
    $ms.Dispose()
}
$srcBmp.Dispose()

$fs = [System.IO.File]::Create($icoPath)
$bw = New-Object System.IO.BinaryWriter($fs)

$bw.Write([uint16]0)
$bw.Write([uint16]1)
$bw.Write([uint16]$sizes.Count)

$offset = 6 + ($sizes.Count * 16)

for ($i = 0; $i -lt $sizes.Count; $i++) {
    $s = $sizes[$i]
    $data = $pngDataList[$i]
    $w = if ($s -ge 256) { [byte]0 } else { [byte]$s }
    $h = if ($s -ge 256) { [byte]0 } else { [byte]$s }
    $bw.Write($w)
    $bw.Write($h)
    $bw.Write([byte]0)
    $bw.Write([byte]0)
    $bw.Write([uint16]1)
    $bw.Write([uint16]32)
    $bw.Write([uint32]$data.Length)
    $bw.Write([uint32]$offset)
    $offset += $data.Length
}

for ($i = 0; $i -lt $sizes.Count; $i++) {
    $bw.Write($pngDataList[$i])
}

$bw.Close()
$fs.Close()
`;

try {
  execFileSync('powershell', ['-NoProfile', '-Command', psScript], { stdio: 'inherit' });
  console.log(`[icons] Successfully created ${destIco} (${fs.statSync(destIco).size} bytes)`);
} catch (err) {
  console.error('[icons] Failed to generate icon.ico:', err.message);
  process.exit(1);
}
