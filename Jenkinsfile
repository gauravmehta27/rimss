pipeline {

    agent any

    tools {
        nodejs 'node-24'
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
                echo Deploying RIMMS...

                if exist "%DEPLOY_DIR%" (
                    rmdir /S /Q "%DEPLOY_DIR%"
                )

                mkdir "%DEPLOY_DIR%"

                xcopy "%BUILD_DIR%\\*" "%DEPLOY_DIR%\\" /E /I /Y

                if exist "deployment\\web.config" (
                    copy /Y "deployment\\web.config" "%DEPLOY_DIR%\\web.config"
                )

                echo Deployment completed.
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