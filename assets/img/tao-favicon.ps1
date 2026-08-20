# Sinh favicon.ico va apple-touch-icon.png tu hinh nguoi chay trong
# logo-bs-kien-mark.svg. Chay lai script nay moi khi doi logo:
#
#   powershell -ExecutionPolicy Bypass -File assets\img\tao-favicon.ps1
#
# Toa do ben duoi chep y nguyen tu logo-bs-kien-mark.svg (he 512x512).
# Windows khong doc duoc SVG nen phai ve lai bang System.Drawing;
# sua dang nguoi chay thi nho sua ca hai noi cho khop.

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Split-Path -Parent (Split-Path -Parent $root)

$NAVY  = [System.Drawing.ColorTranslator]::FromHtml('#1e3a6e')
$BLUE  = [System.Drawing.ColorTranslator]::FromHtml('#3364db')
$LIGHT = [System.Drawing.ColorTranslator]::FromHtml('#3874ff')
$DISC  = [System.Drawing.ColorTranslator]::FromHtml('#f3f6ff')

# Nguoi chay duoc phong to 1.55 lan quanh tam, giong thuoc tinh
# transform trong file SVG.
function P([double]$x, [double]$y) {
    New-Object System.Drawing.PointF(
        [float](256 + 1.55 * ($x - 230)),
        [float](256 + 1.55 * ($y - 239)))
}

function New-Pen($color, [double]$width) {
    $p = New-Object System.Drawing.Pen($color, [float]($width * 1.55))
    $p.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $p.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $p.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $p
}

# Doan cong bac hai cua SVG (lenh Q) doi sang bac ba cua GDI+.
function Add-Quad($path, [double]$x0, [double]$y0, [double]$cx, [double]$cy, [double]$x1, [double]$y1) {
    $a = P $x0 $y0
    $b = P $cx $cy
    $d = P $x1 $y1
    $c1 = New-Object System.Drawing.PointF(
        [float]($a.X + 2.0 / 3.0 * ($b.X - $a.X)),
        [float]($a.Y + 2.0 / 3.0 * ($b.Y - $a.Y)))
    $c2 = New-Object System.Drawing.PointF(
        [float]($d.X + 2.0 / 3.0 * ($b.X - $d.X)),
        [float]($d.Y + 2.0 / 3.0 * ($b.Y - $d.Y)))
    $path.AddBezier($a, $c1, $c2, $d)
}

function Add-Seg($path, [double]$x0, [double]$y0, [double]$x1, [double]$y1) {
    $a = P $x0 $y0
    $b = P $x1 $y1
    $path.AddLine($a, $b)
}

function New-Path { New-Object System.Drawing.Drawing2D.GraphicsPath }

# $nenTrang: to trang kin ca o vuong. Bat cho apple-touch-icon vi iOS
# khong chap nhan nen trong suot, no se ghep len nen den. Tat cho
# favicon de bieu tuong hoa vao mau thanh tab.
function New-Icon([int]$size, [bool]$nenTrang = $false) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size,
        [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    if ($nenTrang) { $g.Clear([System.Drawing.Color]::White) }
    else { $g.Clear([System.Drawing.Color]::Transparent) }
    $g.ScaleTransform([float]($size / 512.0), [float]($size / 512.0))

    # dia nen va vong ngoai
    $g.FillEllipse((New-Object System.Drawing.SolidBrush($DISC)), 12, 12, 488, 488)
    $g.DrawEllipse((New-Object System.Drawing.Pen($NAVY, 16)), 12, 12, 488, 488)

    # ba vet chuyen dong phia sau
    $p1 = New-Path; Add-Quad $p1 116 176 158 168 198 172
    $g.DrawPath((New-Pen $LIGHT 12), $p1)
    $p2 = New-Path; Add-Quad $p2 106 208 152 200 192 204
    $g.DrawPath((New-Pen $LIGHT 10), $p2)
    $p3 = New-Path; Add-Quad $p3 124 240 162 234 190 237
    $g.DrawPath((New-Pen $LIGHT 8.5), $p3)

    # chan sau duoi thang ra sau
    $p4 = New-Path
    Add-Seg $p4 240 258 192 300
    Add-Seg $p4 192 300 150 340
    $g.DrawPath((New-Pen $BLUE 25), $p4)

    # tay sau
    $p5 = New-Path; Add-Seg $p5 278 194 226 212
    $g.DrawPath((New-Pen $LIGHT 21), $p5)

    # than nguoi noi lien xuong chan truoc nang goi
    $p6 = New-Path
    Add-Seg $p6 292 180 240 258
    Add-Seg $p6 240 258 302 246
    Add-Seg $p6 302 246 272 306
    $g.DrawPath((New-Pen $NAVY 26), $p6)

    # tay truoc gap khuyu
    $p7 = New-Path
    Add-Seg $p7 292 184 334 204
    Add-Seg $p7 334 204 342 170
    $g.DrawPath((New-Pen $LIGHT 21), $p7)

    # dau
    $h = P 312 148
    $r = [float](26 * 1.55)
    $g.FillEllipse((New-Object System.Drawing.SolidBrush($NAVY)),
        [float]($h.X - $r), [float]($h.Y - $r), [float](2 * $r), [float](2 * $r))

    $g.Dispose()
    $bmp
}

function Get-PngBytes($bmp) {
    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $bytes = $ms.ToArray()
    $ms.Dispose()
    , $bytes
}

# ---- apple-touch-icon.png ----
$big = New-Icon 180 $true
$big.Save("$root\apple-touch-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$big.Dispose()
Write-Output "apple-touch-icon.png 180x180"

# ---- favicon.ico: gom 16, 32, 48 vao mot file ----
# Moi anh nhet nguyen khoi PNG vao khung ICO. Trinh duyet nay deu hieu
# va file nhe hon nhieu so voi kieu BMP co dien.
$sizes = 16, 32, 48
$pngs = @()
foreach ($s in $sizes) {
    $b = New-Icon $s
    $pngs += , (Get-PngBytes $b)
    $b.Dispose()
}

$ms = New-Object System.IO.MemoryStream
$w = New-Object System.IO.BinaryWriter($ms)
$w.Write([UInt16]0)              # bo trong
$w.Write([UInt16]1)              # loai 1 = icon
$w.Write([UInt16]$sizes.Count)
$offset = 6 + 16 * $sizes.Count
for ($i = 0; $i -lt $sizes.Count; $i++) {
    $w.Write([Byte]$sizes[$i])   # chieu ngang
    $w.Write([Byte]$sizes[$i])   # chieu doc
    $w.Write([Byte]0)            # so mau, 0 = anh that mau
    $w.Write([Byte]0)            # bo trong
    $w.Write([UInt16]1)          # so lop
    $w.Write([UInt16]32)         # so bit moi diem anh
    $w.Write([UInt32]$pngs[$i].Length)
    $w.Write([UInt32]$offset)
    $offset += $pngs[$i].Length
}
foreach ($p in $pngs) { $w.Write($p) }
$w.Flush()
[System.IO.File]::WriteAllBytes("$repo\favicon.ico", $ms.ToArray())
$w.Dispose()
Write-Output "favicon.ico 16+32+48"
