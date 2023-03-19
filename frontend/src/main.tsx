import React, { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import App from './App'
import { ErrorBoundary } from 'react-error-boundary'

const container = document.getElementById('root')

const root = createRoot(container!)

root.render(
    <React.StrictMode>
        <ErrorBoundary fallback={<ErrorHandler />}>
            <App />
        </ErrorBoundary>
    </React.StrictMode>
)

function ErrorHandler() {
    useEffect(() => {
        if (document.location.pathname != '/') {
            document.location = '/'
        }
    }, [])
    return <>error</>
}