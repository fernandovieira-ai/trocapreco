const { io } = require("../app");
const moment = require("moment");

let usuarioInRoom = [];
const usuarioFinalizacao = [];

io.on("connection", (socket) =>{
    //console.log("Dispositivo registrado no servidor, ID: " + socket.id);

    socket.on("user-connected", (user) => {
        //console.log("Dispositivo Efetuou login: "+ user);
    });

    socket.on("disconnect", () => {
        //console.log("Dispositivo Desconectado, ID:" + socket.id);
        // Adicione aqui qualquer código que deseja executar quando a conexão for perdida
    //   usuarioNaArena.splice(0,1).filter(row => row.socket_id == socket.id);
    //   usuarioFinalizacao.splice(0,1).filter(row => row.socket_id == socket.id); 
    });

    socket.on("logadoNoSistema", (data) => {
        try {
            console.log('logadoNoSistema recebido:', data);
    
            // Validação completa dos dados
            if (!data || !data.usuario || !data.room) {
                console.warn('Dados incompletos para login:', data);
                socket.emit('loginError', { message: 'Usuário e room são obrigatórios' });
                return;
            }
    
            // Busca o usuário (case insensitive para evitar duplicatas)
            const userIndex = usuarioInRoom.findIndex(row => 
                row.usuario.toLowerCase() === data.usuario.toLowerCase()
            );
    
            const now = moment().format();
    
            if (userIndex !== -1) {
                // Usuário já existe - atualiza dados
                usuarioInRoom[userIndex] = {
                    ...usuarioInRoom[userIndex], // Mantém dados existentes
                    socket_id: socket.id,
                    room: data.room,
                    ultima_sessao: usuarioInRoom[userIndex].sessao_iniciada,
                    sessao_iniciada: now,
                    // Mantém dados de atividade se existirem
                    inicio_tarefa_atual: usuarioInRoom[userIndex].inicio_tarefa_atual || '',
                    seq_tarefa_atual: usuarioInRoom[userIndex].seq_tarefa_atual || 0,
                    termino_ultima_tarefa: usuarioInRoom[userIndex].termino_ultima_tarefa || '',
                    seq_ultima_tarefa: usuarioInRoom[userIndex].seq_ultima_tarefa || 0
                };
    
                console.log(`Usuário ${data.usuario} atualizado. Nova sessão iniciada.`);
    
            } else {
                // Novo usuário - cria entrada completa
                usuarioInRoom.push({
                    room: data.room,
                    usuario: data.usuario,
                    socket_id: socket.id,
                    inicio_tarefa_atual: '',
                    seq_tarefa_atual: 0,
                    termino_ultima_tarefa: '',
                    seq_ultima_tarefa: 0,
                    sessao_iniciada: now,
                    ultima_sessao: ''
                });
    
                console.log(`Novo usuário ${data.usuario} adicionado ao sistema.`);
            }
    
            // Entra na room
            socket.join(data.room);
    
            // Notifica outros usuários da room (opcional)
            socket.to(data.room).emit('usuarioConectado', {
                usuario: data.usuario,
                socket_id: socket.id,
                timestamp: now
            });
    
            // Envia confirmação para o cliente
            socket.emit('loginSucesso', {
                usuario: data.usuario,
                room: data.room,
                sessao_iniciada: now
            });
    
            console.log('Usuários online:', usuarioInRoom.map(u => u.usuario));
    
        } catch (error) {
            console.error('Erro em logadoNoSistema:', error);
            socket.emit('loginError', { message: 'Erro interno do servidor' });
        }
    });

    socket.on('atividadeFuncionario', (data) => {
        try {
            console.log('atividadeFuncionario', data);
    
            // Validação básica dos dados recebidos
            if (!data || !data.usuario) {
                console.warn('Dados incompletos recebidos em atividadeFuncionario');
                return;
            }
    
            // Encontra o usuário - use findIndex para poder modificar o array original
            const userIndex = usuarioInRoom.findIndex(row => row.usuario === data.usuario);
            
            if (userIndex === -1) {
                console.warn(`Usuário ${data.usuario} não encontrado em usuarioInRoom`);
                return;
            }
    
            const user = usuarioInRoom[userIndex];
            const now = moment().format();
    
            if (data.seq_ultima_tarefa !== 0) {
                // Finalizando uma tarefa
                user.termino_ultima_tarefa = now;
                user.seq_ultima_tarefa = data.seq_ultima_tarefa;
                user.inicio_tarefa_atual = '';
                user.seq_tarefa_atual = 0;
                
                console.log(`Tarefa finalizada: Usuário ${data.usuario}, Tarefa ${data.seq_ultima_tarefa}`);
            } else {
                // Iniciando uma nova tarefa
                user.inicio_tarefa_atual = now;
                user.seq_tarefa_atual = data.seq_tarefa;
                user.termino_ultima_tarefa = '';
                user.seq_ultima_tarefa = 0;
                
                console.log(`Tarefa iniciada: Usuário ${data.usuario}, Tarefa ${data.seq_tarefa}`);
            }
    
            // Atualiza o array com as modificações
            usuarioInRoom[userIndex] = user;
    
            // Opcional: Broadcast para outros usuários na mesma room
            socket.to(user.room).emit('atividadeAtualizada', {
                usuario: user.usuario,
                atividade: user
            });
    
        } catch (error) {
            console.error('Erro em atividadeFuncionario:', error);
            socket.emit('error', { message: 'Erro ao processar atividade' });
        }
    });

    socket.on("exitSistema", (data) => {
        if (!data || !data.room) {
            console.warn(`Socket ${socket.id} tentou sair sem informar a room`);
            return;
        }
    
        // Remove da room
        socket.leave(data.room);
        
        // Remove da lista de usuários
        const index = usuarioInRoom.findIndex(row => row.socket_id === socket.id);
        
        if (index !== -1) {
            const usuarioRemovido = usuarioInRoom[index];
            usuarioInRoom.splice(index, 1);
            console.log(`Usuário ${usuarioRemovido.usuario} saiu do sistema`);
        }
    });
    
    socket.on("atualizacaoTarefa", ( data ) =>{

        //console.log( data );

        io.to(data.room).emit("refresh", (data));
    });

    socket.on("statusAtividadeFuncionario", ( data ) =>{

        io.emit("refreshAtividadeFuncionario", (usuarioInRoom));
    });

    socket.on("exitTelaTarefa", (data) =>{
        //console.log("leave",data);
        socket.leave(data.room);
    });
 

    //socket do app drf troca precos
    socket.on("exitTrocaPreco", (data) =>{
        //console.log("leave",data);
        socket.leave(data.room);
    });
    
    socket.on("atualizacaoAprovacaoTrocaPreco", ( data ) =>{

        //console.log( data );

        io.to(data.room).emit("refresh", (data));
    });

    socket.on("exitTelaAprovacao", (data) =>{
        //console.log("leave",data);
        socket.leave(data.room);
    });

    socket.on("socketFinalizaHorarioArena", ( data ) =>{

       // console.log(data);

        const userInRoom = usuarioFinalizacao.find(row => row.usuario == data.usuario);


        if (userInRoom) {
            userInRoom.socket_id = socket.id;
            userInRoom.room = data.room;
        } else {
            usuarioFinalizacao.push({
                room: data.room,
                usuario: data.usuario,
                socket_id: socket.id
            });
        }
        socket.join(data.room);
        //console.log(usuarioFinalizacao);
    });

    socket.on("atualizacaoFinalizacao", ( data ) =>{

        //console.log( data );

        io.to(data.room).emit("refreshHorario", (data.room));
    });

    socket.on("exitFechamento", (data) =>{
       // console.log("leave",data);
        socket.leave(data.room);
    });
    
});