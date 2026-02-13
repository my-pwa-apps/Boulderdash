// Touch Controls Module for Mobile Devices
// Provides virtual d-pad, swipe gestures, and continuous movement support

export class TouchControls {
    constructor(game) {
        this.game = game;
        this.touchControlsDiv = document.getElementById('touchControls');
        this.grabButton = document.getElementById('grabButton');
        this.isGrabbing = false;
        this.activeDirection = null; // Currently held touch direction
        this.isTouchDevice = this.detectTouchDevice();
        
        // Swipe tracking
        this.swipeStartX = 0;
        this.swipeStartY = 0;
        this.swipeThreshold = 30; // minimum px to register a swipe
        
        if (this.isTouchDevice) {
            document.body.classList.add('touch-device');
            if (this.touchControlsDiv) {
                this.touchControlsDiv.classList.remove('hidden');
            }
            this.setupTouchControls();
            this.setupSwipeControls();
            // Show touch-friendly instruction
            const controlsInfo = document.querySelector('.controls-info p');
            if (controlsInfo) {
                controlsInfo.textContent = 'Tap buttons or swipe to move';
            }
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
     * Setup touch control event listeners on D-pad buttons
     */
    setupTouchControls() {
        const dpadButtons = document.querySelectorAll('.dpad-btn[data-direction]');
        
        dpadButtons.forEach(button => {
            const direction = button.getAttribute('data-direction');
            
            // Touch events — continuous hold support
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                button.classList.add('active');
                this.startDirection(direction);
            }, { passive: false });
            
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                button.classList.remove('active');
                this.stopDirection(direction);
            }, { passive: false });
            
            button.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                button.classList.remove('active');
                this.stopDirection(direction);
            }, { passive: false });
            
            // Allow touch to slide between D-pad buttons
            button.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const el = document.elementFromPoint(touch.clientX, touch.clientY);
                if (el && el !== button && el.classList.contains('dpad-btn') && el.dataset.direction) {
                    button.classList.remove('active');
                    el.classList.add('active');
                    this.stopDirection(direction);
                    this.startDirection(el.dataset.direction);
                }
            }, { passive: false });

            // Mouse events (for testing on desktop)
            button.addEventListener('mousedown', (e) => {
                e.preventDefault();
                button.classList.add('active');
                this.startDirection(direction);
            });
            
            button.addEventListener('mouseup', (e) => {
                e.preventDefault();
                button.classList.remove('active');
                this.stopDirection(direction);
            });
            
            button.addEventListener('mouseleave', () => {
                button.classList.remove('active');
                this.stopDirection(direction);
            });
        });
        
        // Grab button
        if (this.grabButton) {
            this.grabButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.isGrabbing = true;
                this.game.spacePressed = true;
                this.grabButton.classList.add('active');
            }, { passive: false });
            
            this.grabButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.isGrabbing = false;
                this.game.spacePressed = false;
                this.grabButton.classList.remove('active');
            }, { passive: false });
            
            this.grabButton.addEventListener('touchcancel', () => {
                this.isGrabbing = false;
                this.game.spacePressed = false;
                this.grabButton.classList.remove('active');
            });
            
            // Mouse events
            this.grabButton.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.isGrabbing = true;
                this.game.spacePressed = true;
                this.grabButton.classList.add('active');
            });
            
            this.grabButton.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.isGrabbing = false;
                this.game.spacePressed = false;
                this.grabButton.classList.remove('active');
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
     * Setup swipe gesture controls on the game canvas
     */
    setupSwipeControls() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        
        let swipeActive = false;
        
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.swipeStartX = touch.clientX;
            this.swipeStartY = touch.clientY;
            swipeActive = true;
        }, { passive: false });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!swipeActive) return;
            
            const touch = e.touches[0];
            const dx = touch.clientX - this.swipeStartX;
            const dy = touch.clientY - this.swipeStartY;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);
            
            // Only register if past threshold
            if (Math.max(absDx, absDy) < this.swipeThreshold) return;
            
            let direction;
            if (absDx > absDy) {
                direction = dx > 0 ? 'RIGHT' : 'LEFT';
            } else {
                direction = dy > 0 ? 'DOWN' : 'UP';
            }
            
            // Start continuous movement in swipe direction
            if (direction !== this.activeDirection) {
                this.stopDirection(this.activeDirection);
                this.startDirection(direction);
            }
            
            // Reset start point for continuous swiping
            this.swipeStartX = touch.clientX;
            this.swipeStartY = touch.clientY;
        }, { passive: false });
        
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            swipeActive = false;
            this.stopDirection(this.activeDirection);
        }, { passive: false });
        
        canvas.addEventListener('touchcancel', () => {
            swipeActive = false;
            this.stopDirection(this.activeDirection);
        });
    }
    
    /**
     * Start continuous movement in a direction (mirrors keyboard keydown behavior)
     */
    startDirection(direction) {
        if (!direction) return;
        if (this.game && this.game.isRunning && !this.game.gameOver && !this.game.levelComplete) {
            this.activeDirection = direction;
            this.game.keysHeld.add(direction);
            this.game.playerNextDirection = direction;
        }
    }
    
    /**
     * Stop movement in a direction (mirrors keyboard keyup behavior)
     */
    stopDirection(direction) {
        if (!direction) return;
        this.game.keysHeld.delete(direction);
        if (this.activeDirection === direction) {
            this.activeDirection = null;
        }
        // If released direction was current, fall back to another held key or clear
        if (this.game.playerNextDirection === direction) {
            this.game.playerNextDirection = this.game.keysHeld.size > 0 
                ? [...this.game.keysHeld].pop() 
                : null;
        }
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
