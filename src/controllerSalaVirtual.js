import {create} from "zustand";

const store = create((set, get) => ({
    states: {
        conectado: false,
        conectando: false,
        clienteId: null,
        sala: "sala1",
        nome: "",
        cor: "#3B82F6",
        jogadores: {},
        mensagens: [],
        mensagemAtual: "",
        baloesFala: {},
        erroConexao: null,
        socket: null,
        inputFocado: false,
    },
}));

const controllerSalaVirtual = class controllerSalaVirtual {
    static api = class api {
        static async conectar(baseUrl) {
            try {
                controllerSalaVirtual.contexto.state.set_conectando(true);
                controllerSalaVirtual.contexto.state.set_erro_conexao(null);

                const state = store.getState().states;
                const {nome, sala, cor} = state;

                if (!nome.trim()) {
                    throw new Error("Nome é obrigatório");
                }

                let socketUrl = baseUrl;
                if (baseUrl.startsWith("http:")) {
                    socketUrl = baseUrl.replace("http:", "ws:");
                } else if (baseUrl.startsWith("https:")) {
                    socketUrl = baseUrl.replace("https:", "wss:");
                } else if (!baseUrl.startsWith("ws:") && !baseUrl.startsWith("wss:")) {
                    socketUrl = `ws://${baseUrl}`;
                }

                console.log("Conectando ao WebSocket em:", socketUrl);

                const socket = new WebSocket(socketUrl);

                socket.onopen = () => {
                    console.log("WebSocket conectado!");

                    socket.send(
                        JSON.stringify({
                            tipo: "registrar",
                            nome,
                            sala,
                            cor,
                        })
                    );
                };

                socket.onmessage = (event) => {
                    try {
                        const mensagem = JSON.parse(event.data);
                        controllerSalaVirtual.websocket.processarMensagem(mensagem);
                    } catch (error) {
                        console.error("Erro ao processar mensagem:", error);
                    }
                };

                socket.onerror = (error) => {
                    console.error("Erro no WebSocket:", error);
                    controllerSalaVirtual.contexto.state.set_erro_conexao("Erro na conexão WebSocket");
                    controllerSalaVirtual.contexto.state.set_conectando(false);
                };

                socket.onclose = (event) => {
                    console.log("WebSocket fechado:", event.code, event.reason);
                    controllerSalaVirtual.contexto.state.set_conectado(false);

                    if (!event.wasClean) {
                        controllerSalaVirtual.contexto.state.set_erro_conexao("A conexão foi encerrada inesperadamente");
                    }
                };

                controllerSalaVirtual.contexto.state.set_socket(socket);

                controllerSalaVirtual.websocket.iniciarPing();

                return true;
            } catch (error) {
                console.error("Erro na conexão:", error);
                controllerSalaVirtual.contexto.state.set_erro_conexao(error.message);
                controllerSalaVirtual.contexto.state.set_conectando(false);
                return false;
            }
        }

        static async desconectar() {
            const {socket, clienteId} = store.getState().states;

            if (socket) {
                try {
                    controllerSalaVirtual.websocket.pararPing();

                    if (clienteId && socket.readyState === WebSocket.OPEN) {
                        socket.send(
                            JSON.stringify({
                                tipo: "desconectar",
                                clienteId,
                            })
                        );
                    }

                    socket.close();
                } catch (error) {
                    console.error("Erro ao fechar WebSocket:", error);
                }
            }

            controllerSalaVirtual.contexto.state.resetar_estado();
        }
    };

    static contexto = class contexto {
        static jsx = class jsx {
            static get_conectado() {
                return store((state) => state.states.conectado);
            }

            static get_conectando() {
                return store((state) => state.states.conectando);
            }

            static get_nome() {
                return store((state) => state.states.nome);
            }

            static get_sala() {
                return store((state) => state.states.sala);
            }

            static get_cor() {
                return store((state) => state.states.cor);
            }

            static get_jogadores() {
                return store((state) => state.states.jogadores);
            }

            static get_jogador_atual() {
                return store((state) => {
                    const {clienteId, jogadores} = state.states;
                    return clienteId ? jogadores[clienteId] : null;
                });
            }

            static get_mensagens() {
                return store((state) => state.states.mensagens);
            }

            static get_mensagem_atual() {
                return store((state) => state.states.mensagemAtual);
            }

            static get_baloes_fala() {
                return store((state) => state.states.baloesFala);
            }

            static get_erro_conexao() {
                return store((state) => state.states.erroConexao);
            }

            static get_input_focado() {
                return store((state) => state.states.inputFocado);
            }
        };

        static state = class state {
            static set_nome(nome) {
                store.setState((state) => ({
                    states: {
                        ...state.states,
                        nome,
                    },
                }));
            }

            static set_sala(sala) {
                store.setState((state) => ({
                    states: {
                        ...state.states,
                        sala,
                    },
                }));
            }

            static set_cor(cor) {
                store.setState((state) => ({
                    states: {
                        ...state.states,
                        cor,
                    },
                }));
            }

            static set_mensagem_atual(mensagem) {
                store.setState((state) => ({
                    states: {
                        ...state.states,
                        mensagemAtual: mensagem,
                    },
                }));
            }

            static set_input_focado(focado) {
                store.setState((state) => ({
                    states: {
                        ...state.states,
                        inputFocado: focado,
                    },
                }));
            }

            static set_conectando(conectando) {
                store.setState((state) => ({
                    states: {
                        ...state.states,
                        conectando,
                        erroConexao: conectando ? null : state.states.erroConexao,
                    },
                }));
            }

            static set_conectado(conectado) {
                store.setState((state) => ({
                    states: {
                        ...state.states,
                        conectado,
                        conectando: conectado ? false : state.states.conectando,
                    },
                }));
            }

            static set_cliente_id(clienteId) {
                store.setState((state) => ({
                    states: {
                        ...state.states,
                        clienteId,
                    },
                }));
            }

            static set_erro_conexao(erro) {
                store.setState((state) => ({
                    states: {
                        ...state.states,
                        erroConexao: erro,
                    },
                }));
            }

            static set_socket(socket) {
                store.setState((state) => ({
                    states: {
                        ...state.states,
                        socket,
                    },
                }));
            }

            static adicionar_jogador(jogador) {
                store.setState((state) => {
                    if (state.states.jogadores[jogador.id]) {
                        return {
                            states: {
                                ...state.states,
                                jogadores: {
                                    ...state.states.jogadores,
                                    [jogador.id]: {
                                        ...state.states.jogadores[jogador.id],
                                        ...jogador,
                                    },
                                },
                            },
                        };
                    }

                    return {
                        states: {
                            ...state.states,
                            jogadores: {
                                ...state.states.jogadores,
                                [jogador.id]: jogador,
                            },
                        },
                    };
                });
            }

            static remover_jogador(jogadorId) {
                store.setState((state) => {
                    const novosJogadores = {...state.states.jogadores};
                    delete novosJogadores[jogadorId];

                    return {
                        states: {
                            ...state.states,
                            jogadores: novosJogadores,
                        },
                    };
                });
            }

            static atualizar_posicao_jogador(jogadorId, posicao) {
                store.setState((state) => {
                    if (!state.states.jogadores[jogadorId]) return state;

                    return {
                        states: {
                            ...state.states,
                            jogadores: {
                                ...state.states.jogadores,
                                [jogadorId]: {
                                    ...state.states.jogadores[jogadorId],
                                    posicao,
                                },
                            },
                        },
                    };
                });
            }

            static adicionar_mensagem(mensagem) {
                store.setState((state) => ({
                    states: {
                        ...state.states,
                        mensagens: [...state.states.mensagens, mensagem],
                    },
                }));
            }

            static adicionar_balao_fala(jogadorId, texto) {
                const balao = {
                    texto,
                    hora: new Date().toLocaleTimeString(),
                };

                store.setState((state) => ({
                    states: {
                        ...state.states,
                        baloesFala: {
                            ...state.states.baloesFala,
                            [jogadorId]: balao,
                        },
                    },
                }));

                setTimeout(() => {
                    store.setState((state) => {
                        const baloes = {...state.states.baloesFala};

                        if (baloes[jogadorId]?.texto === texto) {
                            delete baloes[jogadorId];
                        }

                        return {
                            states: {
                                ...state.states,
                                baloesFala: baloes,
                            },
                        };
                    });
                }, 5000);
            }

            static resetar_estado() {
                store.setState((state) => ({
                    states: {
                        ...state.states,
                        conectado: false,
                        conectando: false,
                        clienteId: null,
                        jogadores: {},
                        mensagens: [],
                        baloesFala: {},
                        erroConexao: null,
                        socket: null,
                    },
                }));
            }
        };
    };

    static websocket = class websocket {
        static pingInterval = null;

        static iniciarPing() {
            if (this.pingInterval) {
                clearInterval(this.pingInterval);
            }

            this.pingInterval = setInterval(() => {
                const {socket, clienteId} = store.getState().states;

                if (socket && socket.readyState === WebSocket.OPEN && clienteId) {
                    socket.send(
                        JSON.stringify({
                            tipo: "ping",
                            clienteId,
                        })
                    );
                }
            }, 30000);
        }

        static pararPing() {
            if (this.pingInterval) {
                clearInterval(this.pingInterval);
                this.pingInterval = null;
            }
        }

        static processarMensagem(mensagem) {
            const {tipo} = mensagem;

            switch (tipo) {
                case "registrado":
                    this.handleRegistrado(mensagem);
                    break;

                case "jogadores_existentes":
                    this.handleJogadoresExistentes(mensagem);
                    break;

                case "novo_jogador":
                    this.handleNovoJogador(mensagem);
                    break;

                case "jogador_desconectado":
                    this.handleJogadorDesconectado(mensagem);
                    break;

                case "mensagem":
                    this.handleMensagem(mensagem);
                    break;

                case "balao_fala":
                    this.handleBalaoFala(mensagem);
                    break;

                case "movimento":
                    this.handleMovimento(mensagem);
                    break;

                case "erro":
                    controllerSalaVirtual.contexto.state.set_erro_conexao(mensagem.mensagem);
                    break;

                default:
                    console.warn("Tipo de mensagem desconhecido:", tipo);
            }
        }

        static handleRegistrado(mensagem) {
            const {clienteId, posicao} = mensagem;

            controllerSalaVirtual.contexto.state.set_cliente_id(clienteId);

            const {nome, cor} = store.getState().states;
            const jogador = {
                id: clienteId,
                nome,
                cor,
                posicao,
            };

            controllerSalaVirtual.contexto.state.adicionar_jogador(jogador);

            controllerSalaVirtual.contexto.state.set_conectado(true);
            controllerSalaVirtual.contexto.state.set_conectando(false);
        }

        static handleJogadoresExistentes(mensagem) {
            const {jogadores} = mensagem;

            jogadores.forEach((jogador) => {
                controllerSalaVirtual.contexto.state.adicionar_jogador(jogador);
            });
        }

        static handleNovoJogador(mensagem) {
            const {jogador} = mensagem;
            controllerSalaVirtual.contexto.state.adicionar_jogador(jogador);
        }

        static handleJogadorDesconectado(mensagem) {
            const {jogadorId} = mensagem;
            controllerSalaVirtual.contexto.state.remover_jogador(jogadorId);
        }

        static handleMensagem(mensagem) {
            const {sender, texto, hora} = mensagem;

            controllerSalaVirtual.contexto.state.adicionar_mensagem({
                sender,
                texto,
                hora,
            });
        }

        static handleBalaoFala(mensagem) {
            const {jogadorId, texto} = mensagem;
            controllerSalaVirtual.contexto.state.adicionar_balao_fala(jogadorId, texto);
        }

        static handleMovimento(mensagem) {
            const {jogadorId, posicao} = mensagem;
            controllerSalaVirtual.contexto.state.atualizar_posicao_jogador(jogadorId, posicao);
        }

        static enviarMensagem(texto) {
            const {socket, clienteId} = store.getState().states;

            if (!socket || socket.readyState !== WebSocket.OPEN || !clienteId) {
                return false;
            }

            socket.send(
                JSON.stringify({
                    tipo: "mensagem",
                    clienteId,
                    texto,
                })
            );

            return true;
        }

        static enviarMovimento(posicao) {
            const {socket, clienteId} = store.getState().states;

            if (!socket || socket.readyState !== WebSocket.OPEN || !clienteId) {
                return false;
            }

            socket.send(
                JSON.stringify({
                    tipo: "movimento",
                    clienteId,
                    posicao,
                })
            );

            controllerSalaVirtual.contexto.state.atualizar_posicao_jogador(clienteId, posicao);

            return true;
        }
    };
};

export default controllerSalaVirtual;
