@echo off
cd /d "%~dp0"
echo ========================================================
echo  Pushing ConceptRadar to github.com/bhanu5836/conceptrador
echo ========================================================
echo.
git push -u origin main
echo.
if %errorlevel% neq 0 (
    echo.
    echo --------------------------------------------------------
    echo If authentication failed, make sure you are signed in
    echo to GitHub as bhanu5836 in the browser window that opens.
    echo --------------------------------------------------------
) else (
    echo ========================================================
    echo  [SUCCESS] Code pushed successfully to your GitHub!
    echo ========================================================
)
echo.
pause

