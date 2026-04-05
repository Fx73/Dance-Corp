@echo off
for %%f in (*.wav) do (
    ffmpeg -i "%%f" -c:a libvorbis -qscale:a 4 "%%~nf.ogg"
)
echo Conversion terminée !
pause