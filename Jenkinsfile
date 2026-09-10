pipeline {

    agent any

    tools {
        nodejs 'node 24'
    }

    environment {
        DEPLOY_DIR = 'C:\\builds\\RIMMS\\deploy'
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

                dir dist /s /b
                '''
            }
        }

        stage('Deploy Locally') {
            steps {
                bat '''
                @echo off

                echo =====================================
                echo RIMMS LOCAL DEPLOYMENT
                echo =====================================

                if not exist "%WORKSPACE%\\dist\\rimms\\browser\\index.html" (
                    echo ERROR: Angular index.html not found.
                    echo Expected:
                    echo %WORKSPACE%\\dist\\rimms\\browser\\index.html
                    exit /b 1
                )

                echo Build verified successfully.

                if not exist "%DEPLOY_DIR%" (
                    mkdir "%DEPLOY_DIR%"
                )

                echo.
                echo Deploying from:
                echo %WORKSPACE%\\dist\\rimms\\browser

                echo.
                echo Deploying to:
                echo %DEPLOY_DIR%

                robocopy "%WORKSPACE%\\dist\\rimms\\browser" "%DEPLOY_DIR%" /MIR

                set ROBOCOPY_RESULT=%ERRORLEVEL%

                echo.
                echo Robocopy returned code: %ROBOCOPY_RESULT%

                if %ROBOCOPY_RESULT% GEQ 8 (
                    echo ERROR: Deployment failed.
                    exit /b %ROBOCOPY_RESULT%
                )

                echo.
                echo =====================================
                echo RIMMS DEPLOYMENT SUCCESSFUL
                echo =====================================

                exit /b 0
                '''
            }
        }
    }

    post {

        success {
            echo 'RIMMS deployment successful.'
            echo 'Application: http://localhost:8085'
        }

        failure {
            echo 'RIMMS build/deployment failed.'
        }
    }
}