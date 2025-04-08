import "./App.css";

import {useState, useEffect, useRef, useCallback} from "react";

// Estilos globais
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

// Componente Jogador que encapsula lógica de movimentação
const Jogador = ({id, data, isCurrentPlayer, message, roomRef, onMove, inputFocado}) => {
    const {nome, cor, posicao} = data;

    // Função para movimentar o jogador
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

            // Notifica o componente pai sobre a mudança
            onMove(id, posicaoAtual);
        },
        [id, posicao, isCurrentPlayer, onMove, roomRef]
    );

    // Manipulador de teclas para o jogador atual
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

    // Renderiza o personagem
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

// Componente principal da sala
export default function SalaVirtual() {
    const [conectado, setConectado] = useState(false);
    const [nome, setNome] = useState("");
    const [corJogador, setCorJogador] = useState("#3B82F6");
    const [mensagem, setMensagem] = useState("");
    const [mensagensChat, setMensagensChat] = useState([]);
    const [jogadores, setJogadores] = useState({});
    const [jogadorAtual, setJogadorAtual] = useState(null);
    const [mensagensPersonagens, setMensagensPersonagens] = useState({});
    const [inputFocado, setInputFocado] = useState(false);
    const [hoverButton, setHoverButton] = useState(false);
    const salaRef = useRef(null);
    const inputChatRef = useRef(null);

    // Conectar ao servidor (simulado)
    const conectarAoServidor = () => {
        if (!nome.trim()) {
            alert("Por favor, digite seu nome!");
            return;
        }

        setTimeout(() => {
            const idJogador = "jogador_" + Date.now();

            const posicaoInicial = {
                x: 100 + Math.random() * 500,
                y: 100 + Math.random() * 300,
            };

            const novosJogadores = {...jogadores};
            novosJogadores[idJogador] = {
                id: idJogador,
                nome: nome,
                cor: corJogador,
                posicao: posicaoInicial,
            };

            const jogadoresFicticios = [
                {id: "jogador1", nome: "Maria", cor: "#EF4444", posicao: {x: 150, y: 200}},
                {id: "jogador2", nome: "João", cor: "#10B981", posicao: {x: 400, y: 250}},
                {id: "jogador3", nome: "Carlos", cor: "#F59E0B", posicao: {x: 300, y: 150}},
            ];

            jogadoresFicticios.forEach((jogador) => {
                novosJogadores[jogador.id] = jogador;
            });

            setJogadores(novosJogadores);
            setJogadorAtual(idJogador);
            setConectado(true);

            adicionarMensagemChat("Servidor", "Bem-vindo à sala! Use as teclas WASD ou setas para se mover.");
        }, 1000);
    };

    // Adicionar mensagem ao chat
    const adicionarMensagemChat = (remetente, texto) => {
        const novaMensagem = {
            remetente,
            texto,
            hora: new Date().toLocaleTimeString(),
        };

        setMensagensChat((prev) => [...prev, novaMensagem]);

        if (remetente !== "Servidor") {
            const jogadorId = Object.keys(jogadores).find((id) => jogadores[id].nome === remetente);

            if (jogadorId) {
                setMensagensPersonagens((prev) => ({
                    ...prev,
                    [jogadorId]: novaMensagem,
                }));

                setTimeout(() => {
                    setMensagensPersonagens((prev) => {
                        const novasMensagens = {...prev};
                        delete novasMensagens[jogadorId];
                        return novasMensagens;
                    });
                }, 5000);
            }
        }
    };

    // Enviar mensagem no chat
    const enviarMensagem = () => {
        if (!mensagem.trim()) return;

        adicionarMensagemChat(jogadores[jogadorAtual].nome, mensagem);
        setMensagem("");

        if (inputChatRef.current) {
            inputChatRef.current.blur();
            setInputFocado(false);
        }
    };

    // Callback para atualizar a posição do jogador
    const atualizarPosicaoJogador = useCallback((id, novaPosicao) => {
        setJogadores((prev) => ({
            ...prev,
            [id]: {
                ...prev[id],
                posicao: novaPosicao,
            },
        }));
    }, []);

    // Simulação de movimento dos bots
    useEffect(() => {
        if (!conectado) return;

        const intervaloMovimento = setInterval(() => {
            setJogadores((prev) => {
                const novosJogadores = {...prev};

                Object.keys(novosJogadores).forEach((id) => {
                    if (id !== jogadorAtual && Math.random() > 0.7) {
                        const direcao = ["cima", "baixo", "esquerda", "direita"][Math.floor(Math.random() * 4)];
                        const posicao = {...novosJogadores[id].posicao};
                        const velocidade = 10;

                        switch (direcao) {
                            case "cima":
                                posicao.y = Math.max(70, posicao.y - velocidade);
                                break;
                            case "baixo":
                                posicao.y = Math.min(450, posicao.y + velocidade);
                                break;
                            case "esquerda":
                                posicao.x = Math.max(40, posicao.x - velocidade);
                                break;
                            case "direita":
                                posicao.x = Math.min(750, posicao.x + velocidade);
                                break;
                            default:
                                break;
                        }

                        novosJogadores[id].posicao = posicao;
                    }
                });

                return novosJogadores;
            });
        }, 1000);

        return () => clearInterval(intervaloMovimento);
    }, [conectado, jogadorAtual]);

    // Simulação de frases dos bots
    useEffect(() => {
        if (!conectado) return;

        const intervaloFala = setInterval(() => {
            const botIds = Object.keys(jogadores).filter((id) => id !== jogadorAtual);

            if (botIds.length > 0 && Math.random() > 0.7) {
                const botId = botIds[Math.floor(Math.random() * botIds.length)];
                const frases = ["Olá pessoal!", "Como vocês estão?", "Legal esse lugar!", "Alguém quer jogar algo?", "Estou só passeando...", "Que dia bonito!"];

                const fraseAleatoria = frases[Math.floor(Math.random() * frases.length)];
                adicionarMensagemChat(jogadores[botId].nome, fraseAleatoria);
            }
        }, 8000);

        return () => clearInterval(intervaloFala);
    }, [conectado, jogadores, jogadorAtual]);

    // Lida com o pressionamento da tecla Enter para chat
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

    // Tela de login
    if (!conectado) {
        return (
            <div style={styles.loginScreen}>
                <div style={styles.loginBox}>
                    <h1 style={styles.title}>Sala Virtual</h1>

                    <div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Seu nome</label>
                            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} style={styles.input} placeholder="Digite seu nome" />
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
                    </div>
                </div>
            </div>
        );
    }

    // Sala principal
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
                </div>
            </div>

            <div style={styles.sidebar}>
                <h2 style={styles.sidebarTitle}>Jogadores Online</h2>
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
                <div style={styles.chatBox}>
                    {mensagensChat.map((msg, index) => (
                        <div key={index} style={styles.chatMessage}>
                            <span style={styles.chatTime}>{msg.hora}</span>
                            <div>
                                <span style={styles.chatSender}>{msg.remetente}: </span>
                                <span style={styles.chatText}>{msg.texto}</span>
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
