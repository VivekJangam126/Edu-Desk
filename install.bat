@echo off
echo Installing Edu-Desk dependencies...

echo.
echo Installing root dependencies...
call npm install

echo.
echo Installing server dependencies...
cd server
call npm install
cd ..

echo.
echo Installing client dependencies...
cd client
call npm install
cd ..

echo.
echo Installation complete!
echo.
echo To start the application:
echo   npm run dev
echo.
echo The application will be available at:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000
echo.
pause