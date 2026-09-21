pipeline {

    agent any

    tools {
        nodejs 'node 24'
    }

    environment {
        DEPLOY_DIR = 'C:\\builds\\RIMSS\\deploy'
        SITE_URL = 'http://localhost:8085'
        // Set to 'false' to skip live HTTP checks on agents without network access to the IIS site.
        RUN_HTTP_SMOKE_TEST = 'true'
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

                rem Mirror the CONTENTS of browser\\ directly into DEPLOY_DIR (no nested browser\\ folder).
                rem /MIR also removes stale files from prior runs (old hashed bundles, previously
                rem generated index.html), keeping the deployment idempotent.
                robocopy "%WORKSPACE%\\dist\\rimss\\browser" "%DEPLOY_DIR%" /MIR

                set ROBOCOPY_RESULT=%ERRORLEVEL%

                echo.
                echo Robocopy returned code: %ROBOCOPY_RESULT%

                if %ROBOCOPY_RESULT% GEQ 8 (
                    echo ERROR: Deployment failed.
                    exit /b %ROBOCOPY_RESULT%
                )

                echo.
                echo Resolving browser entry document for static IIS hosting...

                rem Angular's server-output build (outputMode: server) emits index.csr.html, not
                rem index.html. Prefer an existing index.html if present, otherwise derive one from
                rem index.csr.html. Never assume index.html exists.
                if exist "%DEPLOY_DIR%\\index.html" (
                    echo Entry document: index.html already present in build output.
                ) else if exist "%DEPLOY_DIR%\\index.csr.html" (
                    echo Entry document: index.csr.html found; creating index.html for static IIS hosting.
                    copy /Y "%DEPLOY_DIR%\\index.csr.html" "%DEPLOY_DIR%\\index.html" >nul
                ) else (
                    echo ERROR: Neither index.html nor index.csr.html found in %DEPLOY_DIR%.
                    exit /b 1
                )

                if not exist "%DEPLOY_DIR%\\index.html" (
                    echo ERROR: index.html could not be created in %DEPLOY_DIR%.
                    exit /b 1
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

        stage('Verify Deployment Artifact') {
            steps {
                powershell '''
                $ErrorActionPreference = "Stop"
                & "$env:WORKSPACE\\tools\\verify-deploy.ps1" `
                    -DeployDir $env:DEPLOY_DIR `
                    -SiteUrl $env:SITE_URL `
                    -CatalogRoute "/catalog" `
                    -RunHttpSmokeTest ([System.Convert]::ToBoolean($env:RUN_HTTP_SMOKE_TEST))
                '''
            }
        }

        stage('Verify IIS Configuration') {
            steps {
                bat '''
                @echo off
                setlocal

                set "APPCMD=%windir%\\system32\\inetsrv\\appcmd.exe"

                if not exist "%APPCMD%" (
                    echo WARNING: appcmd.exe not found at %APPCMD%.
                    echo Skipping IIS site/vdir diagnostics ^(is IIS Management installed on this agent?^).
                    exit /b 0
                )

                echo ===== IIS SITES =====
                "%APPCMD%" list site

                echo.
                echo ===== IIS VIRTUAL DIRECTORIES =====
                "%APPCMD%" list vdir

                echo.
                echo ===== DEPLOY DIRECTORY CHECK =====
                "%APPCMD%" list vdir | findstr /I /C:"%DEPLOY_DIR%" >nul
                if errorlevel 1 (
                    echo WARNING: No IIS virtual directory physical path matches %DEPLOY_DIR%.
                    echo Verify manually that the site serving %SITE_URL% points to this folder.
                ) else (
                    echo OK: Found an IIS virtual directory physical path matching %DEPLOY_DIR%.
                )

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