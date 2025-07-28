import { Observable } from 'rxjs';
import { Empresa } from '../interfaces/Empresa';

export abstract class AbstractEmpresaService {

    abstract getListEmpresas(usuarioId: string): Observable<any>;

    abstract addEmpresa(empresa: Empresa): Observable<any>;

    abstract deleteEmpresa(empresaId: Empresa): Observable<any>;

    abstract getEmpresaById(_id: string): Observable<any>;

    abstract updateEmpresa(empresa: Empresa, empresaId: string | undefined): Observable<any>;

}