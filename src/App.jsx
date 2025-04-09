import "./App.css";

import {useState, useEffect, useRef, useCallback} from "react";

const Jogador = ({id, data, isCurrentPlayer, message, roomRef, onMove, inputFocado}) => {
    const {nome, cor, posicao} = data;

    const moverJogador = useCallback(
        (direcao) => {
            if (!isCurrentPlayer) return;

            const velocidade = 15;
            const posicaoAtual = {...posicao};
            const roomBounds = roomRef.current
                ? {
                      width: roomRef.current.clientWidth,
                      height: roomRef.current.clientHeight,
                  }
                : {width: 800, height: 600};

            switch (direcao) {
                case "cima":
                    posicaoAtual.y = Math.max(70, posicaoAtual.y - velocidade);
                    break;
                case "baixo":
                    posicaoAtual.y = Math.min(roomBounds.height - 70, posicaoAtual.y + velocidade);
                    break;
                case "esquerda":
                    posicaoAtual.x = Math.max(40, posicaoAtual.x - velocidade);
                    break;
                case "direita":
                    posicaoAtual.x = Math.min(roomBounds.width - 40, posicaoAtual.x + velocidade);
                    break;
                default:
                    return;
            }

            onMove(id, posicaoAtual);
        },
        [id, posicao, isCurrentPlayer, onMove, roomRef]
    );

    useEffect(() => {
        if (!isCurrentPlayer) return;

        const tratarTeclaPressionada = (e) => {
            if (inputFocado) return;

            switch (e.key) {
                case "ArrowUp":
                case "w":
                case "W":
                    moverJogador("cima");
                    e.preventDefault();
                    break;
                case "ArrowDown":
                case "s":
                case "S":
                    moverJogador("baixo");
                    e.preventDefault();
                    break;
                case "ArrowLeft":
                case "a":
                case "A":
                    moverJogador("esquerda");
                    e.preventDefault();
                    break;
                case "ArrowRight":
                case "d":
                case "D":
                    moverJogador("direita");
                    e.preventDefault();
                    break;
                default:
                    break;
            }
        };

        window.addEventListener("keydown", tratarTeclaPressionada);
        return () => window.removeEventListener("keydown", tratarTeclaPressionada);
    }, [isCurrentPlayer, moverJogador, inputFocado]);

    return (
        <div
            style={{
                position: "absolute",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transition: "all 0.1s linear",
                left: `${posicao.x}px`,
                top: `${posicao.y}px`,
            }}
        >
            {message && (
                <div
                    style={{
                        marginBottom: "0.5rem",
                        backgroundColor: "white",
                        color: "black",
                        padding: "0.5rem",
                        borderRadius: "0.5rem",
                        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                        maxWidth: "16rem",
                        textAlign: "center",
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        animation: "fadeOut 5s",
                    }}
                >
                    {message.texto}
                </div>
            )}
            <div
                style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    borderRadius: "9999px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "bold",
                    backgroundColor: cor,
                    ...(isCurrentPlayer ? {border: "2px solid #FBBF24"} : {}),
                }}
            >
                {nome.charAt(0).toUpperCase()}
            </div>
            <span
                style={{
                    marginTop: "0.25rem",
                    fontSize: "0.75rem",
                    backgroundColor: "#1F2937",
                    color: "white",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "0.25rem",
                    whiteSpace: "nowrap",
                }}
            >
                {nome}
            </span>
        </div>
    );
};

class WebRTCManager {
    constructor(roomId) {
        this.roomId = roomId;
        this.localId = null;
        this.connections = {};
        this.dataChannels = {};
        this.serverUrl = "http://localhost:3005";
        this.callbacks = {
            onMessage: null,
            onPeerConnected: null,
            onPeerDisconnected: null,
            onDirectConnection: null,
        };

        this.peerConfig = {
            iceServers: [{urls: "stun:stun.l.google.com:19302"}, {urls: "stun:stun1.l.google.com:19302"}],
        };

        this.pollingInterval = null;
        this.pendingMessages = [];
        this.knownPeers = new Set();
    }

    async connect() {
        try {
            const response = await fetch(`${this.serverUrl}/registrar`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({id_sala: this.roomId}),
            });

            const data = await response.json();
            this.localId = data.id_cliente;
            console.log(`[WebRTC] Registrado como: ${this.localId} na sala: ${this.roomId}`);

            const usersResponse = await fetch(`${this.serverUrl}/usuarios?id_sala=${this.roomId}`);
            const usersData = await usersResponse.json();

            for (const peerId of usersData.usuarios) {
                if (peerId !== this.localId) {
                    this.createPeerConnection(peerId, true);
                }
            }

            this.startSignalingPolling();

            return this.localId;
        } catch (error) {
            console.error("[WebRTC] Erro na conexão:", error);
            throw error;
        }
    }

    createPeerConnection(peerId, isInitiator = false) {
        console.log(`[WebRTC] Criando conexão com: ${peerId}, iniciador: ${isInitiator}`);

        const peerConnection = new RTCPeerConnection(this.peerConfig);
        this.connections[peerId] = peerConnection;

        if (isInitiator) {
            const dataChannel = peerConnection.createDataChannel("dataChannel");
            this.setupDataChannel(dataChannel, peerId);
        }

        peerConnection.ondatachannel = (event) => {
            console.log(`[WebRTC] Canal de dados recebido de: ${peerId}`);
            this.setupDataChannel(event.channel, peerId);
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSignal(peerId, {
                    type: "ice-candidate",
                    candidate: event.candidate,
                });
            }
        };

        peerConnection.oniceconnectionstatechange = () => {
            console.log(`[WebRTC] Estado ICE com ${peerId}: ${peerConnection.iceConnectionState}`);

            if (["disconnected", "failed", "closed"].includes(peerConnection.iceConnectionState)) {
                if (this.callbacks.onPeerDisconnected) {
                    this.callbacks.onPeerDisconnected(peerId);
                }
            }
        };

        if (isInitiator) {
            this.createAndSendOffer(peerId, peerConnection);
        }

        return peerConnection;
    }

    setupDataChannel(channel, peerId) {
        this.dataChannels[peerId] = channel;

        channel.onopen = () => {
            console.log(`[WebRTC] Canal de dados ABERTO com: ${peerId}`);

            this.knownPeers.add(peerId);

            if (this.callbacks.onPeerConnected) {
                this.callbacks.onPeerConnected(peerId);
            }

            this.checkDirectConnections();
        };

        channel.onclose = () => {
            console.log(`[WebRTC] Canal de dados FECHADO com: ${peerId}`);
            delete this.dataChannels[peerId];
            this.knownPeers.delete(peerId);
        };

        channel.onerror = (error) => {
            console.error(`[WebRTC] Erro no canal com ${peerId}:`, error);
        };

        channel.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);

                if (this.callbacks.onMessage) {
                    this.callbacks.onMessage(peerId, message);
                }
            } catch (error) {
                console.error("[WebRTC] Erro ao processar mensagem:", error);
            }
        };
    }

    checkDirectConnections() {
        const hasOpenChannel = Object.values(this.dataChannels).some((channel) => channel.readyState === "open");

        if (hasOpenChannel && this.pollingInterval) {
            console.log("[WebRTC] Conexão direta estabelecida! Parando polling HTTP.");
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;

            if (this.callbacks.onDirectConnection) {
                this.callbacks.onDirectConnection();
            }
        }
    }

    async createAndSendOffer(peerId, peerConnection) {
        try {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            this.sendSignal(peerId, {
                type: "offer",
                sdp: peerConnection.localDescription,
            });
        } catch (error) {
            console.error("[WebRTC] Erro ao criar oferta:", error);
        }
    }

    startSignalingPolling() {
        console.log("[WebRTC] Iniciando polling para sinalização");

        this.pollingInterval = setInterval(async () => {
            await this.sendPendingSignals();

            await this.receiveSignals();
        }, 1000);
    }

    async sendPendingSignals() {
        if (this.pendingMessages.length === 0) return;

        try {
            await fetch(`${this.serverUrl}/enviar`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    id_cliente: this.localId,
                    mensagens: [...this.pendingMessages],
                }),
            });

            this.pendingMessages = [];
        } catch (error) {
            console.error("[WebRTC] Erro ao enviar sinais:", error);
        }
    }

    async receiveSignals() {
        try {
            const response = await fetch(`${this.serverUrl}/mensagens?id_cliente=${this.localId}`);
            const data = await response.json();

            if (data.mensagens && data.mensagens.length > 0) {
                for (const message of data.mensagens) {
                    await this.handleSignal(message);
                }
            }
        } catch (error) {
            console.error("[WebRTC] Erro ao receber sinais:", error);
        }
    }

    async handleSignal(message) {
        const {tipo, de, id_peer} = message;

        switch (tipo) {
            case "novo-usuario":
            case "usuario-existente":
                const peerId = id_peer || de;
                if (peerId && peerId !== this.localId && !this.connections[peerId]) {
                    this.createPeerConnection(peerId, tipo === "usuario-existente");
                }
                break;

            case "usuario-desconectado":
                if (id_peer && this.connections[id_peer]) {
                    this.closeConnection(id_peer);
                }
                break;

            case "offer":
                await this.handleOffer(message);
                break;

            case "answer":
                await this.handleAnswer(message);
                break;

            case "ice-candidate":
                await this.handleIceCandidate(message);
                break;

            case "jogador-info":
                if (de && this.callbacks.onPlayerInfo) {
                    this.callbacks.onPlayerInfo(de, message.jogador);
                }
                break;
        }
    }

    async handleOffer(message) {
        const {de, sdp} = message;

        try {
            if (!this.connections[de]) {
                this.createPeerConnection(de, false);
            }

            const peerConnection = this.connections[de];

            await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));

            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            this.sendSignal(de, {
                type: "answer",
                sdp: peerConnection.localDescription,
            });
        } catch (error) {
            console.error("[WebRTC] Erro ao processar oferta:", error);
        }
    }

    async handleAnswer(message) {
        const {de, sdp} = message;

        try {
            if (this.connections[de]) {
                await this.connections[de].setRemoteDescription(new RTCSessionDescription(sdp));
            }
        } catch (error) {
            console.error("[WebRTC] Erro ao processar resposta:", error);
        }
    }

    async handleIceCandidate(message) {
        const {de, candidate} = message;

        try {
            if (this.connections[de]) {
                await this.connections[de].addIceCandidate(new RTCIceCandidate(candidate));
            }
        } catch (error) {
            console.error("[WebRTC] Erro ao adicionar candidato ICE:", error);
        }
    }

    sendSignal(peerId, signal) {
        this.pendingMessages.push({
            tipo: signal.type,
            para: peerId,
            de: this.localId,
            ...signal,
        });
    }

    closeConnection(peerId) {
        if (this.connections[peerId]) {
            this.connections[peerId].close();
            delete this.connections[peerId];
        }

        if (this.dataChannels[peerId]) {
            this.dataChannels[peerId].close();
            delete this.dataChannels[peerId];
        }

        this.knownPeers.delete(peerId);

        if (this.callbacks.onPeerDisconnected) {
            this.callbacks.onPeerDisconnected(peerId);
        }
    }

    sendToAll(message) {
        let sent = false;

        Object.keys(this.dataChannels).forEach((peerId) => {
            const channel = this.dataChannels[peerId];
            if (channel && channel.readyState === "open") {
                channel.send(JSON.stringify(message));
                sent = true;
            }
        });

        return sent;
    }

    sendToPeer(peerId, message) {
        const channel = this.dataChannels[peerId];

        if (channel && channel.readyState === "open") {
            channel.send(JSON.stringify(message));
            return true;
        }

        return false;
    }

    on(event, callback) {
        if (event === "onMessage") this.callbacks.onMessage = callback;
        if (event === "onPeerConnected") this.callbacks.onPeerConnected = callback;
        if (event === "onPeerDisconnected") this.callbacks.onPeerDisconnected = callback;
        if (event === "onDirectConnection") this.callbacks.onDirectConnection = callback;
        if (event === "onPlayerInfo") this.callbacks.onPlayerInfo = callback;
    }

    async disconnect() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }

        try {
            await fetch(`${this.serverUrl}/desconectar`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    id_cliente: this.localId,
                    id_sala: this.roomId,
                }),
            });
        } catch (error) {
            console.error("[WebRTC] Erro ao desconectar do servidor:", error);
        }

        Object.keys(this.connections).forEach((peerId) => {
            this.closeConnection(peerId);
        });
    }
}

const styles = {
    app: {
        display: "flex",
        height: "100dvh",
        maxHeight: "100dvh",
        backgroundColor: "#111827",
        fontFamily: "Arial, sans-serif",
    },
    loginScreen: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        maxHeight: "100dvh",
        height: "100dvh",
        backgroundColor: "#111827",
    },
    loginBox: {
        backgroundColor: "#1F2937",
        borderRadius: "0.5rem",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        padding: "3rem",
        width: "100%",
        maxWidth: "28rem",
    },
    title: {
        fontSize: "1.875rem",
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: "2rem",
        color: "white",
    },
    formGroup: {
        marginBottom: "1.5rem",
    },
    label: {
        display: "block",
        color: "white",
        marginBottom: "0.5rem",
    },
    input: {
        width: "100%",
        padding: "0.75rem",
        backgroundColor: "#374151",
        color: "white",
        borderRadius: "0.5rem",
        border: "1px solid #4B5563",
        outline: "none",
    },
    colorPicker: {
        display: "flex",
        justifyContent: "space-between",
        marginTop: "0.5rem",
    },
    colorOption: {
        width: "2.5rem",
        height: "2.5rem",
        borderRadius: "9999px",
        cursor: "pointer",
    },
    colorOptionSelected: {
        border: "2px solid white",
        boxShadow: "0 0 0 2px #1F2937",
    },
    button: {
        width: "100%",
        backgroundColor: "#2563EB",
        color: "white",
        fontWeight: "bold",
        padding: "0.75rem 1rem",
        borderRadius: "0.5rem",
        border: "none",
        cursor: "pointer",
        transition: "background-color 0.2s",
    },
    buttonHover: {
        backgroundColor: "#1D4ED8",
    },
    gameArea: {
        flexGrow: 1,
        position: "relative",
        overflow: "hidden",
    },
    room: {
        position: "absolute",
        inset: "1rem",
        backgroundColor: "#1F2937",
        borderRadius: "0.5rem",
    },
    grid: {
        position: "absolute",
        inset: 0,
        backgroundImage: "linear-gradient(to right, rgba(75, 85, 99, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(75, 85, 99, 0.1) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
    },
    controls: {
        position: "absolute",
        bottom: "1rem",
        right: "1rem",
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "0.5rem",
    },
    controlBtn: {
        backgroundColor: "#374151",
        color: "white",
        padding: "0.75rem",
        borderRadius: "0.5rem",
        border: "none",
        cursor: "pointer",
    },
    modeIndicator: {
        position: "absolute",
        top: "1rem",
        left: "1rem",
        backgroundColor: "rgba(31, 41, 55, 0.8)",
        color: "white",
        fontSize: "0.875rem",
        padding: "0.5rem",
        borderRadius: "0.5rem",
    },
    statusIndicator: {
        position: "absolute",
        top: "1rem",
        right: "1rem",
        backgroundColor: "rgba(31, 41, 55, 0.8)",
        color: "white",
        fontSize: "0.875rem",
        padding: "0.5rem",
        borderRadius: "0.5rem",
    },
    sidebar: {
        width: "20rem",
        backgroundColor: "#1F2937",
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
    },
    sidebarTitle: {
        fontSize: "1.25rem",
        fontWeight: "bold",
        color: "white",
        marginBottom: "0.5rem",
    },
    playerList: {
        marginBottom: "1rem",
    },
    playerItem: {
        display: "flex",
        alignItems: "center",
        marginBottom: "0.5rem",
    },
    playerColor: {
        width: "1.5rem",
        height: "1.5rem",
        borderRadius: "9999px",
        marginRight: "0.5rem",
    },
    playerName: {
        color: "white",
    },
    chatBox: {
        flexGrow: 1,
        backgroundColor: "#374151",
        borderRadius: "0.5rem",
        padding: "0.5rem",
        marginBottom: "1rem",
        overflowY: "auto",
    },
    chatMessage: {
        marginBottom: "0.5rem",
    },
    chatTime: {
        color: "#9CA3AF",
        fontSize: "0.75rem",
    },
    chatSender: {
        fontWeight: "bold",
        color: "#60A5FA",
    },
    chatText: {
        color: "white",
    },
    chatInput: {
        display: "flex",
    },
    inputField: {
        flexGrow: 1,
        padding: "0.5rem",
        backgroundColor: "#374151",
        color: "white",
        borderRadius: "0.375rem 0 0 0.375rem",
        border: "1px solid #4B5563",
        outline: "none",
    },
    sendButton: {
        backgroundColor: "#2563EB",
        color: "white",
        padding: "0 1rem",
        borderRadius: "0 0.375rem 0.375rem 0",
        border: "none",
        cursor: "pointer",
    },
};

export default function SalaVirtual() {
    const [conectado, setConectado] = useState(false);
    const [nome, setNome] = useState("");
    const [corJogador, setCorJogador] = useState("#3B82F6");
    const [sala, setSala] = useState("sala1");
    const [mensagem, setMensagem] = useState("");
    const [mensagensChat, setMensagensChat] = useState([]);
    const [jogadores, setJogadores] = useState({});
    const [jogadorAtual, setJogadorAtual] = useState(null);
    const [mensagensPersonagens, setMensagensPersonagens] = useState({});
    const [inputFocado, setInputFocado] = useState(false);
    const [hoverButton, setHoverButton] = useState(false);
    const [conexaoStatus, setConexaoStatus] = useState("");
    const [conexaoDireta, setConexaoDireta] = useState(false);

    const salaRef = useRef(null);
    const inputChatRef = useRef(null);
    const webRTCRef = useRef(null);
    const chatBoxRef = useRef(null);

    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [mensagensChat]);

    const conectarAoServidor = async () => {
        if (!nome.trim()) {
            alert("Por favor, digite seu nome!");
            return;
        }

        try {
            setConexaoStatus("Conectando ao servidor...");

            const webRTC = new WebRTCManager(sala);
            webRTCRef.current = webRTC;

            const idLocal = await webRTC.connect();
            setConexaoStatus("Estabelecendo conexões com outros jogadores...");

            const posicaoInicial = {
                x: 100 + Math.random() * 500,
                y: 100 + Math.random() * 300,
            };

            const jogadorData = {
                id: idLocal,
                nome: nome,
                cor: corJogador,
                posicao: posicaoInicial,
            };

            const jogadoresIniciais = {[idLocal]: jogadorData};
            setJogadores(jogadoresIniciais);
            setJogadorAtual(idLocal);
            setConectado(true);

            webRTC.on("onMessage", (peerId, mensagemRecebida) => {
                console.log(`Mensagem recebida de ${peerId}:`, mensagemRecebida);

                if (mensagemRecebida.tipo === "chat") {
                    adicionarMensagemChat(mensagemRecebida.remetente, mensagemRecebida.texto);

                    const mensagemBalao = {
                        remetente: mensagemRecebida.remetente,
                        texto: mensagemRecebida.texto,
                        hora: new Date().toLocaleTimeString(),
                    };

                    setMensagensPersonagens((prev) => ({
                        ...prev,
                        [peerId]: mensagemBalao,
                    }));

                    setTimeout(() => {
                        setMensagensPersonagens((prev) => {
                            const novasMensagens = {...prev};
                            delete novasMensagens[peerId];
                            return novasMensagens;
                        });
                    }, 5000);
                } else if (mensagemRecebida.tipo === "jogador-info") {
                    console.log(`Recebido jogador-info de ${peerId}:`, mensagemRecebida.jogador);
                    atualizarJogador(peerId, mensagemRecebida.jogador);
                } else if (mensagemRecebida.tipo === "movimento") {
                    console.log(`Movimento recebido de ${peerId}:`, mensagemRecebida.posicao);
                    atualizarPosicaoJogador(peerId, mensagemRecebida.posicao);
                }
            });

            webRTC.on("onPeerConnected", (peerId) => {
                console.log(`Conexão estabelecida com: ${peerId}`);

                webRTC.sendToPeer(peerId, {
                    tipo: "jogador-info",
                    jogador: jogadorData,
                });

                adicionarMensagemChat("Servidor", "Novo jogador conectado!");
            });

            webRTC.on("onPeerDisconnected", (peerId) => {
                setJogadores((prev) => {
                    const novos = {...prev};
                    delete novos[peerId];
                    return novos;
                });

                adicionarMensagemChat("Servidor", "Um jogador desconectou.");
            });

            webRTC.on("onDirectConnection", () => {
                setConexaoStatus("Conectado via WebRTC (P2P)");
                setConexaoDireta(true);
            });

            webRTC.on("onPlayerInfo", (peerId, dadosJogador) => {
                console.log(`Recebendo informações do jogador ${peerId}:`, dadosJogador);
                atualizarJogador(peerId, dadosJogador);
            });

            adicionarMensagemChat("Servidor", "Bem-vindo à sala! Use as teclas WASD ou setas para se mover.");
        } catch (error) {
            console.error("Erro na conexão:", error);
            setConexaoStatus("Erro ao conectar. Tente novamente.");
        }
    };

    const atualizarJogador = (id, dados) => {
        console.log(`Atualizando jogador ${id}:`, dados);

        setJogadores((prev) => {
            if (id === jogadorAtual && prev[jogadorAtual]) {
                return {
                    ...prev,
                    [id]: {
                        ...dados,
                        posicao: prev[jogadorAtual].posicao,
                    },
                };
            }

            return {
                ...prev,
                [id]: dados,
            };
        });
    };

    const adicionarMensagemChat = (remetente, texto) => {
        const novaMensagem = {
            remetente,
            texto,
            hora: new Date().toLocaleTimeString(),
        };

        setMensagensChat((prev) => [...prev, novaMensagem]);

        if (remetente !== "Servidor" && remetente === jogadores[jogadorAtual]?.nome) {
            setMensagensPersonagens((prev) => ({
                ...prev,
                [jogadorAtual]: novaMensagem,
            }));

            setTimeout(() => {
                setMensagensPersonagens((prev) => {
                    const novasMensagens = {...prev};
                    delete novasMensagens[jogadorAtual];
                    return novasMensagens;
                });
            }, 5000);
        }
    };

    const enviarMensagem = () => {
        if (!mensagem.trim()) return;

        adicionarMensagemChat(jogadores[jogadorAtual]?.nome, mensagem);

        if (webRTCRef.current) {
            webRTCRef.current.sendToAll({
                tipo: "chat",
                remetente: jogadores[jogadorAtual]?.nome,
                texto: mensagem,
            });
        }

        setMensagem("");

        if (inputChatRef.current) {
            inputChatRef.current.blur();
            setInputFocado(false);
        }
    };
    const atualizarPosicaoJogador = useCallback(
        (id, novaPosicao) => {
            console.log(`Atualizando posição do jogador ${id}:`, novaPosicao);

            setJogadores((prev) => {
                if (!prev[id]) {
                    console.warn(`Tentando atualizar jogador ${id} que não existe`);
                    return prev;
                }

                // Atualizar posição
                const novoEstado = {
                    ...prev,
                    [id]: {
                        ...prev[id],
                        posicao: novaPosicao,
                    },
                };

                if (id === jogadorAtual && webRTCRef.current) {
                    console.log(`Enviando posição do jogador ${id} para outros:`, novaPosicao);
                    webRTCRef.current.sendToAll({
                        tipo: "movimento",
                        id: id,
                        posicao: novaPosicao,
                    });
                }

                return novoEstado;
            });
        },
        [jogadorAtual]
    );

    useEffect(() => {
        return () => {
            if (webRTCRef.current) {
                webRTCRef.current.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        if (!conectado) return;

        const handleEnterKey = (e) => {
            if (e.key === "Enter" && inputFocado) {
                enviarMensagem();
                e.preventDefault();
            }
        };

        window.addEventListener("keydown", handleEnterKey);
        return () => window.removeEventListener("keydown", handleEnterKey);
    }, [conectado, inputFocado, mensagem]);

    if (!conectado) {
        return (
            <div style={styles.loginScreen}>
                <div style={styles.loginBox}>
                    <h1 style={styles.title}>Sala Virtual WebRTC</h1>

                    <div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Seu nome</label>
                            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} style={styles.input} placeholder="Digite seu nome" />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>ID da Sala</label>
                            <input type="text" value={sala} onChange={(e) => setSala(e.target.value)} style={styles.input} placeholder="ID da sala (ex: sala1)" />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Cor do personagem</label>
                            <div style={styles.colorPicker}>
                                {["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"].map((cor) => (
                                    <div
                                        key={cor}
                                        onClick={() => setCorJogador(cor)}
                                        style={{
                                            ...styles.colorOption,
                                            backgroundColor: cor,
                                            ...(corJogador === cor ? styles.colorOptionSelected : {}),
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={conectarAoServidor}
                            onMouseEnter={() => setHoverButton(true)}
                            onMouseLeave={() => setHoverButton(false)}
                            style={{
                                ...styles.button,
                                ...(hoverButton ? styles.buttonHover : {}),
                            }}
                        >
                            Entrar na Sala
                        </button>

                        {conexaoStatus && (
                            <div
                                style={{
                                    marginTop: "1rem",
                                    color: "white",
                                    textAlign: "center",
                                    fontSize: "0.875rem",
                                }}
                            >
                                {conexaoStatus}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.app}>
            <div style={styles.gameArea} ref={salaRef}>
                <div style={styles.room}>
                    <div style={styles.grid}></div>

                    {/* Renderiza todos os jogadores usando o componente Jogador */}
                    {Object.keys(jogadores).map((id) => (
                        <Jogador
                            key={id}
                            id={id}
                            data={jogadores[id]}
                            isCurrentPlayer={id === jogadorAtual}
                            message={mensagensPersonagens[id]}
                            roomRef={salaRef}
                            onMove={atualizarPosicaoJogador}
                            inputFocado={inputFocado}
                        />
                    ))}

                    {/* Controles de movimento para dispositivos móveis */}
                    <div style={styles.controls}>
                        <div></div>
                        <button
                            onClick={() => {
                                if (jogadorAtual) {
                                    const jogador = jogadores[jogadorAtual];
                                    const novaPosicao = {...jogador.posicao};
                                    novaPosicao.y = Math.max(70, novaPosicao.y - 15);
                                    atualizarPosicaoJogador(jogadorAtual, novaPosicao);
                                }
                            }}
                            style={styles.controlBtn}
                        >
                            ↑
                        </button>
                        <div></div>
                        <button
                            onClick={() => {
                                if (jogadorAtual) {
                                    const jogador = jogadores[jogadorAtual];
                                    const novaPosicao = {...jogador.posicao};
                                    novaPosicao.x = Math.max(40, novaPosicao.x - 15);
                                    atualizarPosicaoJogador(jogadorAtual, novaPosicao);
                                }
                            }}
                            style={styles.controlBtn}
                        >
                            ←
                        </button>
                        <button
                            onClick={() => {
                                if (jogadorAtual) {
                                    const jogador = jogadores[jogadorAtual];
                                    const novaPosicao = {...jogador.posicao};
                                    const altura = salaRef.current ? salaRef.current.clientHeight : 600;
                                    novaPosicao.y = Math.min(altura - 70, novaPosicao.y + 15);
                                    atualizarPosicaoJogador(jogadorAtual, novaPosicao);
                                }
                            }}
                            style={styles.controlBtn}
                        >
                            ↓
                        </button>
                        <button
                            onClick={() => {
                                if (jogadorAtual) {
                                    const jogador = jogadores[jogadorAtual];
                                    const novaPosicao = {...jogador.posicao};
                                    const largura = salaRef.current ? salaRef.current.clientWidth : 800;
                                    novaPosicao.x = Math.min(largura - 40, novaPosicao.x + 15);
                                    atualizarPosicaoJogador(jogadorAtual, novaPosicao);
                                }
                            }}
                            style={styles.controlBtn}
                        >
                            →
                        </button>
                    </div>

                    <div style={styles.modeIndicator}>{inputFocado ? "Digite sua mensagem" : "Use W, A, S, D ou as setas para se mover"}</div>

                    <div style={styles.statusIndicator}>Status: {conexaoDireta ? "Conexão P2P direta ✓" : "Sinalizando..."}</div>
                </div>
            </div>

            <div style={styles.sidebar}>
                <h2 style={styles.sidebarTitle}>Sala: {sala}</h2>
                <h2 style={styles.sidebarTitle}>Jogadores Online ({Object.keys(jogadores).length})</h2>
                <div style={styles.playerList}>
                    {Object.values(jogadores).map((jogador) => (
                        <div key={jogador.id} style={styles.playerItem}>
                            <div
                                style={{
                                    ...styles.playerColor,
                                    backgroundColor: jogador.cor,
                                }}
                            />
                            <span style={styles.playerName}>
                                {jogador.nome} {jogador.id === jogadorAtual ? "(você)" : ""}
                            </span>
                        </div>
                    ))}
                </div>

                <h2 style={styles.sidebarTitle}>Chat</h2>
                <div style={styles.chatBox} ref={chatBoxRef}>
                    {mensagensChat.map((msg, index) => (
                        <div key={index} style={styles.chatMessage}>
                            <span style={styles.chatTime}>{msg.hora}</span>
                            <div>
                                <span
                                    style={{
                                        ...styles.chatSender,
                                        color: msg.remetente === "Servidor" ? "#9CA3AF" : "#60A5FA",
                                        fontWeight: msg.remetente === "Servidor" ? "normal" : "bold",
                                    }}
                                >
                                    {msg.remetente}:
                                </span>
                                <span style={styles.chatText}> {msg.texto}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={styles.chatInput}>
                    <input
                        ref={inputChatRef}
                        type="text"
                        value={mensagem}
                        onChange={(e) => setMensagem(e.target.value)}
                        onFocus={() => setInputFocado(true)}
                        onBlur={() => setInputFocado(false)}
                        style={styles.inputField}
                        placeholder="Digite uma mensagem"
                    />
                    <button onClick={enviarMensagem} style={styles.sendButton}>
                        Enviar
                    </button>
                </div>
            </div>
        </div>
    );
}
