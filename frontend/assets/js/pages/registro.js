/* ============================================
   SPEAKLEXI - LÓGICA ESPECÍFICA DE REGISTRO
   Archivo: assets/js/pages/registro.js
   ============================================ */

class RegistroPage {
    constructor() {
        this.init();
    }

    init() {
        console.log('✅ Página de registro inicializada');
        this.setupEventListeners();
        this.setupRealTimeValidation();
    }

    setupEventListeners() {
        // Elementos DOM
        this.registerForm = document.getElementById('register-form');
        this.nombreInput = document.getElementById('nombre');
        this.primerApellidoInput = document.getElementById('primer_apellido');
        this.segundoApellidoInput = document.getElementById('segundo_apellido');
        this.correoInput = document.getElementById('correo');
        this.passwordInput = document.getElementById('password');
        this.confirmPasswordInput = document.getElementById('confirmPassword');
        this.idiomaSelect = document.getElementById('idioma_aprendizaje');
        this.submitBtn = document.getElementById('submit-btn');
        this.errorAlert = document.getElementById('error-alert');
        this.errorMessage = document.getElementById('error-message');
        this.togglePassword = document.getElementById('toggle-password');
        this.toggleConfirmPassword = document.getElementById('toggle-confirm-password');
        this.eyeIcon1 = document.getElementById('eye-icon-1');
        this.eyeIcon2 = document.getElementById('eye-icon-2');
        this.passwordMatch = document.getElementById('password-match');
        this.strengthBars = [
            document.getElementById('strength-1'),
            document.getElementById('strength-2'),
            document.getElementById('strength-3'),
            document.getElementById('strength-4')
        ];
        this.passwordFeedback = document.getElementById('password-feedback');

        // Event listeners
        if (this.registerForm) {
            this.registerForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        if (this.togglePassword) {
            this.togglePassword.addEventListener('click', () => this.togglePasswordVisibility('password'));
        }

        if (this.toggleConfirmPassword) {
            this.toggleConfirmPassword.addEventListener('click', () => this.togglePasswordVisibility('confirmPassword'));
        }

        if (this.passwordInput) {
            this.passwordInput.addEventListener('input', () => this.handlePasswordInput());
        }

        if (this.confirmPasswordInput) {
            this.confirmPasswordInput.addEventListener('input', () => this.validatePasswords());
        }
    }

    setupRealTimeValidation() {
        // Validación en tiempo real para campos requeridos
        const requiredFields = [
            this.nombreInput, 
            this.primerApellidoInput, 
            this.correoInput, 
            this.passwordInput, 
            this.confirmPasswordInput, 
            this.idiomaSelect
        ];

        requiredFields.forEach(field => {
            if (field) {
                field.addEventListener('blur', () => {
                    if (!field.value && field.hasAttribute('required')) {
                        field.classList.add('border-red-500');
                    } else {
                        field.classList.remove('border-red-500');
                    }
                });
            }
        });

        // Validación de email en tiempo real
        if (this.correoInput) {
            FormValidator.setupRealtimeValidation(this.correoInput, FormValidator.validateEmail);
        }
    }

    togglePasswordVisibility(type) {
        const input = type === 'password' ? this.passwordInput : this.confirmPasswordInput;
        const icon = type === 'password' ? this.eyeIcon1 : this.eyeIcon2;

        if (!input || !icon) return;

        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
    }

    handlePasswordInput() {
        if (!this.passwordInput) return;

        const password = this.passwordInput.value;
        
        // Actualizar UI de fortaleza
        FormValidator.updatePasswordStrengthUI(password, this.strengthBars, this.passwordFeedback);
        
        // Validar coincidencia
        this.validatePasswords();
    }

    validatePasswords() {
        if (!this.passwordInput || !this.confirmPasswordInput || !this.passwordMatch) return;

        const password = this.passwordInput.value;
        const confirmPassword = this.confirmPasswordInput.value;

        if (password && confirmPassword) {
            const isValid = FormValidator.validatePasswordMatch(password, confirmPassword);
            
            if (isValid) {
                this.confirmPasswordInput.classList.remove('border-red-500', 'dark:border-red-400');
                this.confirmPasswordInput.classList.add('border-green-500', 'dark:border-green-400');
                this.passwordMatch.classList.remove('hidden');
            } else {
                this.confirmPasswordInput.classList.add('border-red-500', 'dark:border-red-400');
                this.confirmPasswordInput.classList.remove('border-green-500', 'dark:border-green-400');
                this.passwordMatch.classList.add('hidden');
            }
        } else {
            this.confirmPasswordInput.classList.remove('border-red-500', 'border-green-500', 'dark:border-red-400', 'dark:border-green-400');
            this.passwordMatch.classList.add('hidden');
        }
    }

    validateForm() {
        let isValid = true;
        this.hideError();

        // Validar campos requeridos
        const requiredFields = [
            { field: this.nombreInput, name: 'Nombre' },
            { field: this.primerApellidoInput, name: 'Primer apellido' },
            { field: this.correoInput, name: 'Correo electrónico' },
            { field: this.passwordInput, name: 'Contraseña' },
            { field: this.confirmPasswordInput, name: 'Confirmar contraseña' },
            { field: this.idiomaSelect, name: 'Idioma de aprendizaje' }
        ];

        const missingFields = requiredFields.filter(item => !item.field.value.trim());

        if (missingFields.length > 0) {
            this.showError(`Los siguientes campos son obligatorios: ${missingFields.map(f => f.name).join(', ')}`);
            isValid = false;
        }

        // Validar email
        if (this.correoInput.value && !FormValidator.validateEmail(this.correoInput.value)) {
            this.showError('Por favor ingresa un email válido');
            isValid = false;
        }

        // Validar contraseña
        if (this.passwordInput.value) {
            const passwordValidation = FormValidator.validatePassword(this.passwordInput.value);
            if (!passwordValidation.isValid) {
                this.showError(`La contraseña debe cumplir con: ${passwordValidation.errors.join(', ')}`);
                isValid = false;
            }
        }

        // Validar que las contraseñas coincidan
        if (this.passwordInput.value !== this.confirmPasswordInput.value) {
            this.showError('Las contraseñas no coinciden');
            isValid = false;
        }

        return isValid;
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            return;
        }

        this.setLoadingState(true);

        try {
            // Procesar segundo_apellido correctamente
            let segundoApellidoValue = this.segundoApellidoInput ? this.segundoApellidoInput.value : null;
            if (segundoApellidoValue !== null && segundoApellidoValue !== undefined) {
                segundoApellidoValue = segundoApellidoValue.trim();
                if (segundoApellidoValue === '') {
                    segundoApellidoValue = null;
                }
            }

            const userData = {
                nombre: this.nombreInput.value.trim(),
                primer_apellido: this.primerApellidoInput.value.trim(),
                segundo_apellido: segundoApellidoValue,
                correo: this.correoInput.value.trim(),
                password: this.passwordInput.value,
                rol: 'alumno',
                idioma: this.idiomaSelect.value,
                nivel_actual: 'A1'
            };

            console.log('📤 Enviando datos de registro:', userData);

            // Usar el API Client modular
            const response = await window.apiClient.registro(userData);

            if (!response.success) {
                // Manejar errores de validación detallados
                if (response.errores && response.errores.length > 0) {
                    console.error('❌ Errores de validación:', response.errores);
                    FormValidator.mostrarErrorDetallado('Errores de validación', response.errores);
                    window.toastManager.error(response.error || 'Datos inválidos');
                    return;
                }
                
                throw new Error(response.error || 'Error al registrar usuario');
            }

            // ✅ ÉXITO - Guardar datos y redirigir
            Utils.saveToStorage('correo', this.correoInput.value);
            Utils.saveToStorage('idioma', this.idiomaSelect.value);

            window.toastManager.success('✅ Cuenta creada exitosamente. Revisa tu email para verificar tu cuenta.');

            setTimeout(() => {
                window.location.href = `verificar-email.html?email=${encodeURIComponent(this.correoInput.value)}`;
            }, 2000);

        } catch (error) {
            console.error('💥 Error en registro:', error);
            
            let errorMsg = error.message || 'Error desconocido al crear la cuenta';
            
            // Mensajes específicos según el tipo de error
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('conexión')) {
                errorMsg = 'No se pudo conectar al servidor. Verifica que el servidor esté ejecutándose en http://localhost:5000';
            } else if (error.message.includes('correo') && error.message.includes('registrado')) {
                errorMsg = 'El correo electrónico ya está registrado. Intenta iniciar sesión o usa otro correo.';
            }
            
            this.showError(errorMsg);
            window.toastManager.error(errorMsg);
            
        } finally {
            this.setLoadingState(false);
        }
    }

    setLoadingState(isLoading) {
        if (!this.submitBtn) return;

        if (isLoading) {
            this.submitBtn.disabled = true;
            this.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creando cuenta...';
        } else {
            this.submitBtn.disabled = false;
            this.submitBtn.innerHTML = '<i class="fas fa-user-plus mr-2"></i>Crear Cuenta';
        }
    }

    showError(message) {
        if (!this.errorAlert || !this.errorMessage) return;

        this.errorMessage.textContent = message;
        this.errorAlert.classList.remove('hidden');
        this.errorAlert.classList.add('animate-slide-in');
    }

    hideError() {
        if (!this.errorAlert || !this.errorMessage) return;

        this.errorMessage.textContent = '';
        this.errorAlert.classList.add('hidden');
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.registroPage = new RegistroPage();
    });
} else {
    window.registroPage = new RegistroPage();
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RegistroPage;
}