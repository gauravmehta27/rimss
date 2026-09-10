pipeline {

    agent any

    tools {
        nodejs 'node 24'
    }

    environment {
        DEPLOY_DIR = 'C:\\builds\\RIMMS\\deploy'

        // CHANGE THIS if your Angular project has a different name
        BUILD_DIR = 'dist\\rimms\\browser'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Environment Check') {
            steps {
                bat 'node --version'
                bat 'npm --version'
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm ci'
            }
        }

        stage('Build Angular') {
            steps {
                bat 'npx ng build --configuration production'
            }
        }

        stage('Deploy Locally') {
            steps {
                bat '''
                @echo off

                echo ==============================
                echo RIMMS DEPLOYMENT
                echo ==============================

                echo Jenkins Workspace:
                echo %WORKSPACE%

                echo Build Directory:
                echo %WORKSPACE%\\%BUILD_DIR%

                echo Deployment Directory:
                echo %DEPLOY_DIR%

                echo.

                if not exist "%WORKSPACE%\\%BUILD_DIR%" (
                    echo ERROR: Angular build directory does not exist.
                    exit /b 1
                )

                if not exist "%DEPLOY_DIR%" (
                    mkdir "%DEPLOY_DIR%"
                )

                echo Copying application...

                robocopy "%WORKSPACE%\\%BUILD_DIR%" "%DEPLOY_DIR%" /MIR

                set ROBOCOPY_EXIT=%ERRORLEVEL%

                if %ROBOCOPY_EXIT% GEQ 8 (
                    echo ERROR: Deployment copy failed.
                    exit /b %ROBOCOPY_EXIT%
                )

                if exist "%WORKSPACE%\\deployment\\web.config" (
                    copy /Y "%WORKSPACE%\\deployment\\web.config" "%DEPLOY_DIR%\\web.config"

                    if errorlevel 1 (
                        echo ERROR: Could not copy web.config
                        exit /b 1
                    )
                )

                echo.
                echo ==============================
                echo Deployment completed successfully
                echo Target: %DEPLOY_DIR%
                echo ==============================
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