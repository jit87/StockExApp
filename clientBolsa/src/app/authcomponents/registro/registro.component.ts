import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent {

  registerForm: FormGroup;
    constructor(
        private fb: FormBuilder,
        private authService: AuthService
      ) {
        this.registerForm = this.fb.group({
          nombre: ['', [Validators.required]],
          email: ['', [Validators.required, Validators.email]],
          password: ['', [Validators.required]]
        });
      }

      onSubmit() {
        if (this.registerForm.valid) {
          const { nombre, email, password } = this.registerForm.value;
          this.authService.register(nombre, email, password).subscribe(
            () => console.log('Registro exitoso'),
            (error) => console.error(error)
          );
        }
  }
  
  
}
