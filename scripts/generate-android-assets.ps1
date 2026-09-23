Add-Type -AssemblyName System.Drawing

$srcIconPath = Resolve-Path "public\icon-512x512.png"
$srcIcon = [System.Drawing.Bitmap]::FromFile($srcIconPath)

$brandBgColor = [System.Drawing.ColorTranslator]::FromHtml("#0a0f1d")

# Function to resize an image with high quality
function Resize-Image($source, $width, $height) {
    $dest = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($source, 0, 0, $width, $height)
    $g.Dispose()
    return $dest
}

# Function to create adaptive foreground with safe padding (inner 66%)
function Create-AdaptiveForeground($source, $canvasSize) {
    $dest = New-Object System.Drawing.Bitmap($canvasSize, $canvasSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    
    $innerSize = [math]::Round($canvasSize * 0.68)
    $offset = [math]::Round(($canvasSize - $innerSize) / 2)
    $g.DrawImage($source, $offset, $offset, $innerSize, $innerSize)
    $g.Dispose()
    return $dest
}

# Function to create legacy icon with rounded dark background
function Create-LegacyIcon($source, $size) {
    $dest = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    # Fill rounded background
    $brush = New-Object System.Drawing.SolidBrush($brandBgColor)
    $g.FillEllipse($brush, 0, 0, $size, $size)
    $brush.Dispose()
    
    # Draw logo centered inside
    $innerSize = [math]::Round($size * 0.78)
    $offset = [math]::Round(($size - $innerSize) / 2)
    $g.DrawImage($source, $offset, $offset, $innerSize, $innerSize)
    $g.Dispose()
    return $dest
}

# Function to create splash screen
function Create-Splash($source, $w, $h) {
    $dest = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    # Clear with dark brand background
    $g.Clear($brandBgColor)
    
    # Draw logo in center
    $minDim = [math]::Min($w, $h)
    $logoSize = [math]::Min(360, [math]::Round($minDim * 0.38))
    $logoX = [math]::Round(($w - $logoSize) / 2)
    $logoY = [math]::Round(($h - $logoSize) / 2)
    $g.DrawImage($source, $logoX, $logoY, $logoSize, $logoSize)
    $g.Dispose()
    return $dest
}

$mipmapConfig = @(
    @{ Folder = "mipmap-mdpi";    IconSize = 48;  FgSize = 108 },
    @{ Folder = "mipmap-hdpi";    IconSize = 72;  FgSize = 162 },
    @{ Folder = "mipmap-xhdpi";   IconSize = 96;  FgSize = 216 },
    @{ Folder = "mipmap-xxhdpi";  IconSize = 144; FgSize = 324 },
    @{ Folder = "mipmap-xxxhdpi"; IconSize = 192; FgSize = 432 }
)

Write-Host "Generating Android launcher mipmap icons..."
foreach ($cfg in $mipmapConfig) {
    $dir = Join-Path "android\app\src\main\res" $cfg.Folder
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    
    # 1. ic_launcher.png
    $icon = Create-LegacyIcon $srcIcon $cfg.IconSize
    $icon.Save((Join-Path $dir "ic_launcher.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $icon.Dispose()
    
    # 2. ic_launcher_round.png
    $iconRound = Create-LegacyIcon $srcIcon $cfg.IconSize
    $iconRound.Save((Join-Path $dir "ic_launcher_round.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $iconRound.Dispose()
    
    # 3. ic_launcher_foreground.png
    $fg = Create-AdaptiveForeground $srcIcon $cfg.FgSize
    $fg.Save((Join-Path $dir "ic_launcher_foreground.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $fg.Dispose()
    
    Write-Host "  -> Done $dir (icon: $($cfg.IconSize)px, fg: $($cfg.FgSize)px)"
}

# Splash configurations
$splashConfig = @(
    @{ Path = "android\app\src\main\res\drawable\splash.png"; W = 480; H = 800 },
    @{ Path = "android\app\src\main\res\drawable-port-mdpi\splash.png"; W = 320; H = 480 },
    @{ Path = "android\app\src\main\res\drawable-port-hdpi\splash.png"; W = 480; H = 800 },
    @{ Path = "android\app\src\main\res\drawable-port-xhdpi\splash.png"; W = 720; H = 1280 },
    @{ Path = "android\app\src\main\res\drawable-port-xxhdpi\splash.png"; W = 960; H = 1600 },
    @{ Path = "android\app\src\main\res\drawable-port-xxxhdpi\splash.png"; W = 1280; H = 1920 },
    @{ Path = "android\app\src\main\res\drawable-land-mdpi\splash.png"; W = 480; H = 320 },
    @{ Path = "android\app\src\main\res\drawable-land-hdpi\splash.png"; W = 800; H = 480 },
    @{ Path = "android\app\src\main\res\drawable-land-xhdpi\splash.png"; W = 1280; H = 720 },
    @{ Path = "android\app\src\main\res\drawable-land-xxhdpi\splash.png"; W = 1600; H = 960 },
    @{ Path = "android\app\src\main\res\drawable-land-xxxhdpi\splash.png"; W = 1920; H = 1280 }
)

Write-Host "Generating Android splash screens..."
foreach ($sp in $splashConfig) {
    $parent = Split-Path $sp.Path -Parent
    if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
    $splashImg = Create-Splash $srcIcon $sp.W $sp.H
    $splashImg.Save($sp.Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $splashImg.Dispose()
    Write-Host "  -> Done $($sp.Path) ($($sp.W)x$($sp.H))"
}

$srcIcon.Dispose()
Write-Host "All Android icons and splash assets successfully generated!"
