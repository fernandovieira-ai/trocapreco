import { Injectable } from '@angular/core';
import { pessoa, regiao, item, itemfull, subGrupo } from '../class/user';

@Injectable({
  providedIn: 'root'
})
export class DataloadService {

    public pessoa: pessoa[] = []
    public filtroPessoa = [...this.pessoa]
    public regiao: regiao[] = []
   // public item: item[] = []
    //public itemfull: itemfull[] = []
    public subGrupo: subGrupo[] = []

    dadosCarregados = false

    atualizacaoDisponivel = false;

  constructor() { }
}
