// Touch Controls Module for Mobile Devices
// Provides virtual d-pad and touch gesture support

export class TouchControls {
    constructor(game) {
        this.game = game;
        this.touchControlsDiv = document.getElementById('touchControls');
        this.grabButton = document.getElementById('grabButton');
        this.isGrabbing = false;
        this.isTouchDevice = this.detectTouchDevice();
        
        if (this.isTouchDevice && this.touchControlsDiv) {
            this.touchControlsDiv.classList.remove('hidden');
            this.setupTouchControls();
        }
    }
    
    /**
     * Detect if device supports touch
     */
    detectTouchDevice() {
        return (('ontouchstart' in window) ||
                (navigator.maxTouchPoints > 0) ||
                (navigator.msMaxTouchPoints > 0));
    }
    
    /**
     * Setup touch control event listeners
     */
    setupTouchControls() {
        // D-pad buttons
        const dpadButtons = document.querySelectorAll('.dpad-btn[data-direction]');
        
        dpadButtons.forEach(button => {
            const direction = button.getAttribute('data-direction');
            
            // Touch events
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleDirectionPress(direction);
            }, { passive: false });
            
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.handleDirectionRelease(direction);
            }, { passive: false });
            
            // Mouse events (for testing on desktop)
            button.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.handleDirectionPress(direction);
            });
            
            button.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.handleDirectionRelease(direction);
            });
        });
        
        // Grab button
        if (this.grabButton) {
            this.grabButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.isGrabbing = true;
                this.game.spacePressed = true;
            }, { passive: false });
            
            this.grabButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.isGrabbing = false;
                this.game.spacePressed = false;
            }, { passive: false });
            
            // Mouse events
            this.grabButton.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.isGrabbing = true;
                this.game.spacePressed = true;
            });
            
            this.grabButton.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.isGrabbing = false;
                this.game.spacePressed = false;
            });
        }
        
        // Prevent default touch behaviors on the game canvas
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
            canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
            canvas.addEventListener('touchend', (e) => e.preventDefault(), { passive: false });
        }
    }
    
    /**
     * Handle direction button press
     */
    handleDirectionPress(direction) {
        if (this.game && this.game.isRunning && !this.game.gameOver && !this.game.levelComplete) {
            this.game.playerNextDirection = direction;
        }
    }
    
    /**
     * Handle direction button release
     */
    handleDirectionRelease(direction) {
        // Optional: could add release handling if needed
    }
    
    /**
     * Hide touch controls
     */
    hide() {
        if (this.touchControlsDiv) {
            this.touchControlsDiv.classList.add('hidden');
        }
    }
    
    /**
     * Show touch controls
     */
    show() {
        if (this.isTouchDevice && this.touchControlsDiv) {
            this.touchControlsDiv.classList.remove('hidden');
        }
    }
    
    /**
     * Toggle touch controls visibility
     */
    toggle() {
        if (this.touchControlsDiv) {
            this.touchControlsDiv.classList.toggle('hidden');
        }
    }
}
