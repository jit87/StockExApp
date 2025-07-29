import { Observable } from 'rxjs';

export abstract class AbstractAuthService {

    abstract login(email: string, password: string): Observable<any>;

    abstract registro(nombre: string, email: string, password: string): Observable<any>;

    abstract logout(): void;

    abstract getToken(): string | null;

    abstract isAuthenticated(): boolean;

    abstract getUserById(id: string): Observable<any>;

    abstract getUserByEmail(email: string | null): Observable<any>;

    abstract isLoggedIn(): boolean;

    abstract authStatusListener(): Observable<boolean>;

    abstract modificarPassword(
        email: string,
        actualPassword: string,
        nuevaPassword: string
    ): Observable<any>;

    abstract modificarNombre(
        email: string,
        nuevoNombre: string
    ): Observable<any>;

    abstract modificarEmail(
        email: string,
        nuevoEmail: string
    ): Observable<any>;

    abstract getAuthUrl(): string;

}