import {useState, useEffect, useRef} from "react";
import "./App.css";
import controller_sala_virtual from "./controller_sala_virtual";

const PUBLIC_BASE_URL = import.meta.env.PUBLIC_BASE_URL || "ws://localhost:50010";

const Jogador = ({id, data, isCurrentPlayer, balaoFala, roomRef, onMove, inputFocado}) => {
    const {nome, cor, posicao} = data;

    const moverJogador = (direcao) => {
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

        onMove(posicaoAtual);
    };

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
    }, [isCurrentPlayer, inputFocado]);

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
            {balaoFala && (
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
                    {balaoFala.texto}
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
    const [hoverButton, setHoverButton] = useState(false);

    const useNome = controller_sala_virtual.contexto.jsx.get_nome();
    const useSala = controller_sala_virtual.contexto.jsx.get_sala();
    const useCor = controller_sala_virtual.contexto.jsx.get_cor();
    const useConectado = controller_sala_virtual.contexto.jsx.get_conectado();
    const useConectando = controller_sala_virtual.contexto.jsx.get_conectando();
    const useErroConexao = controller_sala_virtual.contexto.jsx.get_erro_conexao();
    const useJogadores = controller_sala_virtual.contexto.jsx.get_jogadores();
    const useJogadorAtual = controller_sala_virtual.contexto.jsx.get_jogador_atual();
    const useMensagens = controller_sala_virtual.contexto.jsx.get_mensagens();
    const useMensagemAtual = controller_sala_virtual.contexto.jsx.get_mensagem_atual();
    const useBaloesFala = controller_sala_virtual.contexto.jsx.get_baloes_fala();
    const useInputFocado = controller_sala_virtual.contexto.jsx.get_input_focado();

    const salaRef = useRef(null);
    const inputChatRef = useRef(null);
    const chatBoxRef = useRef(null);

    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [useMensagens]);

    const conectarAoServidor = async () => {
        if (!useNome.trim()) {
            alert("Por favor, digite seu nome!");
            return;
        }

        await controller_sala_virtual.api.conectar(PUBLIC_BASE_URL);
    };

    const enviarMensagem = () => {
        if (!useMensagemAtual.trim()) return;

        const enviado = controller_sala_virtual.websocket.enviarMensagem(useMensagemAtual);

        if (enviado) {
            controller_sala_virtual.contexto.state.set_mensagem_atual("");

            if (inputChatRef.current) {
                inputChatRef.current.blur();
                controller_sala_virtual.contexto.state.set_input_focado(false);
            }
        }
    };

    const atualizarPosicaoJogador = (novaPosicao) => {
        if (!useJogadorAtual) return;
        controller_sala_virtual.websocket.enviarMovimento(novaPosicao);
    };

    useEffect(() => {
        return () => {
            controller_sala_virtual.api.desconectar();
        };
    }, []);

    useEffect(() => {
        if (!useConectado) return;

        const handleEnterKey = (e) => {
            if (e.key === "Enter" && useInputFocado) {
                enviarMensagem();
                e.preventDefault();
            }
        };

        window.addEventListener("keydown", handleEnterKey);
        return () => window.removeEventListener("keydown", handleEnterKey);
    }, [useConectado, useInputFocado, useMensagemAtual]);

    if (!useConectado) {
        return (
            <div style={styles.loginScreen}>
                <div style={styles.loginBox}>
                    <h1 style={styles.title}>Sala Virtual WebSocket</h1>

                    <div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Seu nome</label>
                            <input
                                type="text"
                                value={useNome}
                                onChange={(e) => controller_sala_virtual.contexto.state.set_nome(e.target.value)}
                                style={styles.input}
                                placeholder="Digite seu nome"
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>ID da Sala</label>
                            <input
                                type="text"
                                value={useSala}
                                onChange={(e) => controller_sala_virtual.contexto.state.set_sala(e.target.value)}
                                style={styles.input}
                                placeholder="ID da sala (ex: sala1)"
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Cor do personagem</label>
                            <div style={styles.colorPicker}>
                                {["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"].map((cor) => (
                                    <div
                                        key={cor}
                                        onClick={() => controller_sala_virtual.contexto.state.set_cor(cor)}
                                        style={{
                                            ...styles.colorOption,
                                            backgroundColor: cor,
                                            ...(useCor === cor ? styles.colorOptionSelected : {}),
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
                            disabled={useConectando}
                        >
                            {useConectando ? "Conectando..." : "Entrar na Sala"}
                        </button>

                        {useErroConexao && (
                            <div
                                style={{
                                    marginTop: "1rem",
                                    color: "#EF4444",
                                    textAlign: "center",
                                    fontSize: "0.875rem",
                                }}
                            >
                                {useErroConexao}
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

                    {Object.keys(useJogadores).map((id) => (
                        <Jogador
                            key={id}
                            id={id}
                            data={useJogadores[id]}
                            isCurrentPlayer={useJogadorAtual && id === useJogadorAtual.id}
                            balaoFala={useBaloesFala[id]}
                            roomRef={salaRef}
                            onMove={atualizarPosicaoJogador}
                            inputFocado={useInputFocado}
                        />
                    ))}

                    <div style={styles.controls}>
                        <div></div>
                        <button
                            onClick={() => {
                                if (useJogadorAtual) {
                                    const novaPosicao = {...useJogadorAtual.posicao};
                                    novaPosicao.y = Math.max(70, novaPosicao.y - 15);
                                    atualizarPosicaoJogador(novaPosicao);
                                }
                            }}
                            style={styles.controlBtn}
                        >
                            ↑
                        </button>
                        <div></div>
                        <button
                            onClick={() => {
                                if (useJogadorAtual) {
                                    const novaPosicao = {...useJogadorAtual.posicao};
                                    novaPosicao.x = Math.max(40, novaPosicao.x - 15);
                                    atualizarPosicaoJogador(novaPosicao);
                                }
                            }}
                            style={styles.controlBtn}
                        >
                            ←
                        </button>
                        <button
                            onClick={() => {
                                if (useJogadorAtual) {
                                    const novaPosicao = {...useJogadorAtual.posicao};
                                    const altura = salaRef.current ? salaRef.current.clientHeight : 600;
                                    novaPosicao.y = Math.min(altura - 70, novaPosicao.y + 15);
                                    atualizarPosicaoJogador(novaPosicao);
                                }
                            }}
                            style={styles.controlBtn}
                        >
                            ↓
                        </button>
                        <button
                            onClick={() => {
                                if (useJogadorAtual) {
                                    const novaPosicao = {...useJogadorAtual.posicao};
                                    const largura = salaRef.current ? salaRef.current.clientWidth : 800;
                                    novaPosicao.x = Math.min(largura - 40, novaPosicao.x + 15);
                                    atualizarPosicaoJogador(novaPosicao);
                                }
                            }}
                            style={styles.controlBtn}
                        >
                            →
                        </button>
                    </div>

                    <div style={styles.modeIndicator}>{useInputFocado ? "Digite sua mensagem" : "Use W, A, S, D ou as setas para se mover"}</div>
                    <div style={styles.statusIndicator}>{useConectado ? "Conectado ✓" : "Conectando..."}</div>
                </div>
            </div>

            <div style={styles.sidebar}>
                <h2 style={styles.sidebarTitle}>Sala: {useSala}</h2>
                <h2 style={styles.sidebarTitle}>Jogadores Online ({Object.keys(useJogadores).length})</h2>
                <div style={styles.playerList}>
                    {Object.values(useJogadores).map((jogador) => (
                        <div key={jogador.id} style={styles.playerItem}>
                            <div
                                style={{
                                    ...styles.playerColor,
                                    backgroundColor: jogador.cor,
                                }}
                            />
                            <span style={styles.playerName}>
                                {jogador.nome} {useJogadorAtual && jogador.id === useJogadorAtual.id ? "(você)" : ""}
                            </span>
                        </div>
                    ))}
                </div>

                <h2 style={styles.sidebarTitle}>Chat</h2>
                <div style={styles.chatBox} ref={chatBoxRef}>
                    {useMensagens.map((msg, index) => (
                        <div key={index} style={styles.chatMessage}>
                            <span style={styles.chatTime}>{msg.hora}</span>
                            <div>
                                <span
                                    style={{
                                        ...styles.chatSender,
                                        color: msg.sender === "Sistema" ? "#9CA3AF" : "#60A5FA",
                                        fontWeight: msg.sender === "Sistema" ? "normal" : "bold",
                                    }}
                                >
                                    {msg.sender}:
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
                        value={useMensagemAtual}
                        onChange={(e) => controller_sala_virtual.contexto.state.set_mensagem_atual(e.target.value)}
                        onFocus={() => controller_sala_virtual.contexto.state.set_input_focado(true)}
                        onBlur={() => controller_sala_virtual.contexto.state.set_input_focado(false)}
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
