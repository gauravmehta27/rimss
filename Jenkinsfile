pipeline {

    agent any

    tools {
        nodejs 'node 24'
    }

    environment {
        DEPLOY_DIR = 'C:\\builds\\RIMSS\\deploy'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Environment Check') {
            steps {
                bat '''
                @echo off

                echo Workspace:
                echo %WORKSPACE%

                echo.
                echo Node version:
                node --version

                echo.
                echo NPM version:
                call npm --version
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                bat '''
                @echo off
                call npm ci
                '''
            }
        }

        stage('Build Angular') {
            steps {
                bat '''
                @echo off

                echo Cleaning previous builds...

                if exist dist (
                    rmdir /S /Q dist
                )

                echo.
                echo Building Angular production application...

                call npx ng build --configuration production

                if errorlevel 1 (
                    echo ERROR: Angular build failed.
                    exit /b 1
                )

                echo.
                echo Build completed successfully.

                if not exist "%WORKSPACE%\\dist\\rimss\\server\\server.mjs" (
                    echo ERROR: Angular SSR server output not found.
                    echo Expected:
                    echo %WORKSPACE%\\dist\\rimss\\server\\server.mjs
                    exit /b 1
                )

                echo SSR server output verified successfully.

                dir dist /s /b
                '''
            }
        }

        stage('Deploy Locally') {
            steps {
                bat '''
                @echo off

                echo =====================================
                echo RIMSS LOCAL DEPLOYMENT
                echo =====================================

                if not exist "%WORKSPACE%\\dist\\rimss\\browser\\index.csr.html" (
                    echo ERROR: Angular index.csr.html not found.
                    echo Expected:
                    echo %WORKSPACE%\\dist\\rimss\\browser\\index.csr.html
                    exit /b 1
                )

                echo Build verified successfully.

                echo.
                echo SSR server output:
                echo %WORKSPACE%\\dist\\rimss\\server\\server.mjs

                if not exist "%DEPLOY_DIR%" (
                    mkdir "%DEPLOY_DIR%"
                )

                echo.
                echo Deploying from:
                echo %WORKSPACE%\\dist\\rimss\\browser

                echo.
                echo Deploying to:
                echo %DEPLOY_DIR%

                rem Deploy the browser bundle to the IIS site root.
                robocopy "%WORKSPACE%\\dist\\rimss\\browser" "%DEPLOY_DIR%" /MIR

                set ROBOCOPY_RESULT=%ERRORLEVEL%

                echo.
                echo Robocopy returned code: %ROBOCOPY_RESULT%

                if %ROBOCOPY_RESULT% GEQ 8 (
                    echo ERROR: Deployment failed.
                    exit /b %ROBOCOPY_RESULT%
                )

                echo.
                echo Deploying SSR server bundle to:
                echo %DEPLOY_DIR%\\server

                rem Keep the server beside browser so server.mjs resolves ../browser.
                robocopy "%WORKSPACE%\\dist\\rimss\\server" "%DEPLOY_DIR%\\server" /MIR

                set ROBOCOPY_RESULT=%ERRORLEVEL%

                echo.
                echo SSR robocopy returned code: %ROBOCOPY_RESULT%

                if %ROBOCOPY_RESULT% GEQ 8 (
                    echo ERROR: SSR deployment failed.
                    exit /b %ROBOCOPY_RESULT%
                )

                if not exist "%DEPLOY_DIR%\\server\\server.mjs" (
                    echo ERROR: Deployed SSR server output not found.
                    exit /b 1
                )

                echo.
                echo =====================================
                echo RIMSS DEPLOYMENT SUCCESSFUL
                echo =====================================

                exit /b 0
                '''
            }
        }
    }

    post {

        success {
            echo 'RIMSS deployment successful.'
            echo 'Application: http://localhost:8085'
            bat '''
            echo ===== SOURCE WEB.CONFIG =====
            type "%WORKSPACE%\\dist\\rimss\\browser\\web.config"

            echo.
            echo ===== DEPLOYED WEB.CONFIG =====
            type "%DEPLOY_DIR%\\web.config"

            echo.
            echo ===== SOURCE HASH =====
            certutil -hashfile "%WORKSPACE%\\dist\\rimss\\browser\\web.config" SHA256

            echo.
            echo ===== DEPLOYED HASH =====
            certutil -hashfile "%DEPLOY_DIR%\\web.config" SHA256

            echo.
            echo ===== DEPLOYED SSR SERVER =====
            dir "%DEPLOY_DIR%\\server" /s /b
            '''
        }

        failure {
            echo 'RIMSS build/deployment failed.'
        }
    }
}