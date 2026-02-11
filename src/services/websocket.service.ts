import { Injectable } from '@angular/core';
import { ReplaySubject, Observable } from 'rxjs';
import { io } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  socket: any;
  observableExecutado = 0
  executouBuscaTarefas = 0

  constructor() { }

  private readonly baseURLSocketIo = environment["endPointSocket"];

  private tarefasSubject = new ReplaySubject<any>(1);

  socketCon() {
    this.socket = io(this.baseURLSocketIo);
  }

  socketDisconnect(){
    this.socket.disconnect();
  }

  usuarioApp(usuario, room) {
    this.socket.emit('logadoNoSistema', {usuario: usuario, room: room });
  }

  socketExitApp( usuario, room ){

      this.socket.emit('exitTrocaPreco', {usuario: usuario, room: room });
    
  }

  // getAtualizacaoTarefas(): Observable<any> {
  //   return new Observable((observer) => {
  //     const errorHandler = (error: any) => {
  //       observer.error(error);
  //     };

  //     const updateHandler = (data: any) => {
  //       observer.next(data);
  //     };

  //     this.socket.on('refresh', updateHandler);
  //     this.socket.on('error', errorHandler);

  //     console.log("me registrei no observable")

  //     return () => {
  //       this.socket.off('refresh', updateHandler);
  //       this.socket.off('error', errorHandler);
  //     };
  //   });
  // }

  getAtualizacaoTarefas(): Observable<any> {

    if (!this.tarefasSubject.observed) {
      this.socket.on('refresh', (data) => this.tarefasSubject.next(data));
      this.socket.on('error', (error) => this.tarefasSubject.error(error));
    }
    return this.tarefasSubject.asObservable();
  }

  setAtualiacaoTarefas( usuario, room ){
    this.socket.emit('atualizacaoAprovacaoTrocaPreco', {usuario: usuario, room: room });
  }
}
