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
                bat '''
                @echo off

                echo ==========================================
                echo CURRENT JENKINS DIRECTORY
                echo ==========================================
                cd

                echo.
                echo ==========================================
                echo BUILDING ANGULAR
                echo ==========================================

                call npx ng build --configuration production

                if errorlevel 1 (
                    echo ANGULAR BUILD FAILED
                    exit /b 1
                )

                echo.
                echo ==========================================
                echo CONTENTS OF DIST
                echo ==========================================

                if exist dist (
                    dir dist /s /b
                ) else (
                    echo DIST DIRECTORY DOES NOT EXIST
                    exit /b 1
                )
                '''
            }
        }

        stage('Deploy Locally') {
            steps {
                bat '''
                @echo off

                echo ==========================================
                echo RIMMS LOCAL DEPLOYMENT
                echo ==========================================

                echo Current directory:
                cd

                echo.
                echo Build directory:
                echo %BUILD_DIR%

                echo.
                echo Deployment directory:
                echo %DEPLOY_DIR%

                echo.

                if not exist "%BUILD_DIR%" (
                    echo ERROR: Angular build directory does not exist.
                    echo Expected:
                    echo %CD%\\%BUILD_DIR%

                    echo.
                    echo Actual dist contents:
                    dir dist /s /b

                    exit /b 1
                )

                echo.
                echo Angular build directory found successfully.

                if not exist "%DEPLOY_DIR%" (
                    mkdir "%DEPLOY_DIR%"
                )

                echo.
                echo Copying Angular build to:
                echo %DEPLOY_DIR%

                robocopy "%BUILD_DIR%" "%DEPLOY_DIR%" /MIR

                set ROBOCOPY_RESULT=%ERRORLEVEL%

                if %ROBOCOPY_RESULT% GEQ 8 (
                    echo ERROR: Robocopy failed with code %ROBOCOPY_RESULT%
                    exit /b %ROBOCOPY_RESULT%
                )

                echo.
                echo ==========================================
                echo DEPLOYMENT SUCCESSFUL
                echo ==========================================
                echo Source:
                echo %CD%\\%BUILD_DIR%
                echo.
                echo Destination:
                echo %DEPLOY_DIR%
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