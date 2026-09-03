import React, { useState, useEffect, useRef } from "react";
import { Mail, Lock, ArrowRight, UserPlus, FlaskConical } from "lucide-react";
import { signUpWithEmailAndPassword, loginWithEmailAndPassword, describeAuthError } from "../auth";

interface LoginViewProps {
  onLoginSuccess: (email: string, uid: string) => void;
  onEnterSimulation?: () => void;
}

export default function LoginView({ onLoginSuccess, onEnterSimulation }: LoginViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [statusText, setStatusText] = useState("System Alpha Online");
  const [statusIsError, setStatusIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationFrameId: number;
                                                                             
                                                                           
    const gl = (canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;

    if (!gl) return;

    function syncSize() {
      if (!canvas) return;
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    syncSize();
    const resizeObserver = new ResizeObserver(syncSize);
    resizeObserver.observe(canvas);

    const vs = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fs = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        float time = u_time * 0.2;
        
        float n = sin(uv.x * 3.0 + time) * cos(uv.y * 2.0 - time * 0.5);
        n += sin(uv.y * 4.0 + time * 1.2) * cos(uv.x * 5.0 + time * 0.8) * 0.5;
        
        vec3 color1 = vec3(0.039, 0.071, 0.063);
        vec3 color2 = vec3(0.055, 0.102, 0.090);
        vec3 highlight = vec3(0.290, 0.871, 0.502);
        
        vec3 finalColor = mix(color1, color2, n * 0.5 + 0.5);
        finalColor += highlight * pow(max(0.0, n), 3.0) * 0.25;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    function cs(type: number, src: string) {
      const s = gl!.createShader(type);
      if (!s) return null;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    if (!prog) return;

    const vertexShader = cs(gl.VERTEX_SHADER, vs);
    const fragmentShader = cs(gl.FRAGMENT_SHADER, fs);

    if (!vertexShader || !fragmentShader) return;

    gl.attachShader(prog, vertexShader);
    gl.attachShader(prog, fragmentShader);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const pos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes = gl.getUniformLocation(prog, "u_resolution");

    function render(t: number) {
      if (!gl || !canvas) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    }

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, []);

  const resetStatus = () => {
    setStatusText("System Alpha Online");
    setStatusIsError(false);
  };

  const fail = (message: string) => {
    setStatusText(message);
    setStatusIsError(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    resetStatus();
    try {
      if (isSignUp) {
        if (!name || !phone || !address) {
          fail("Please fill all sign-up fields.");
          return;
        }
        const user = await signUpWithEmailAndPassword({
          email,
          password,
          name,
          phone,
          address,
        });
        onLoginSuccess(user.email || email, user.uid);
      } else {
        const user = await loginWithEmailAndPassword(email, password);
        onLoginSuccess(user.email || email, user.uid);
      }
    } catch (err: any) {
      console.error("Authentication failed", err);
      fail(describeAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen text-ink flex items-center justify-center overflow-hidden font-sans">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-0 opacity-80 pointer-events-none"
        style={{ display: "block" }}
      />

      <main className="relative z-10 w-full max-w-md px-6 md:px-0">
        <div className="bg-surface backdrop-blur-[20px] rounded-xl p-8 border-t border-hair-strong border-l border-hair shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20 mb-4">
            <span className="material-symbols-outlined text-accent text-4xl">
              radar
            </span>
          </div>

          <h1 className="font-headline text-3xl font-semibold text-center mb-1 text-ink-strong tracking-tight">
            AgroSense Control
          </h1>
          <p className="text-sm text-ink-muted text-center mb-8">
            {isSignUp ? "Join the monitoring network." : "Monitor your environment, in real time."}
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            {isSignUp && (
              <>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserPlus className="text-ink-muted w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full bg-elev border border-hair-strong rounded-lg py-3 pl-11 pr-4 text-sm text-ink-strong placeholder-ink-muted/40 focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none transition-all duration-300"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="text-ink-muted w-5 h-5" />
                  </div>
                  <input
                    type="tel"
                    required
                    className="w-full bg-elev border border-hair-strong rounded-lg py-3 pl-11 pr-4 text-sm text-ink-strong placeholder-ink-muted/40 focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none transition-all duration-300"
                    placeholder="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="text-ink-muted w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    className="w-full bg-elev border border-hair-strong rounded-lg py-3 pl-11 pr-4 text-sm text-ink-strong placeholder-ink-muted/40 focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none transition-all duration-300"
                    placeholder="Operator Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="text-ink-muted w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full bg-elev border border-hair-strong rounded-lg py-3 pl-11 pr-4 text-sm text-ink-strong placeholder-ink-muted/40 focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none transition-all duration-300"
                    placeholder="Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </>
            )}

            {!isSignUp && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="text-ink-muted w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  className="w-full bg-elev border border-hair-strong rounded-lg py-3 pl-11 pr-4 text-sm text-ink-strong placeholder-ink-muted/40 focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none transition-all duration-300"
                  placeholder="Operator Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="text-ink-muted w-5 h-5" />
              </div>
              <input
                type="password"
                required
                className="w-full bg-elev border border-hair-strong rounded-lg py-3 pl-11 pr-4 text-sm text-ink-strong placeholder-ink-muted/40 focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none transition-all duration-300"
                placeholder="Access Code"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent hover:bg-accent text-on-accent font-bold py-3 px-4 rounded-lg mt-6 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.15)] hover:shadow-[0_0_30px_rgba(56,189,248,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              <span>{isSubmitting ? "Processing..." : isSignUp ? "Initialize Protocol" : "Sign In"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {onEnterSimulation && (
            <button
              type="button"
              onClick={onEnterSimulation}
              className="w-full mt-3 py-2.5 px-4 rounded-lg border border-c-amber/30 bg-c-amber/10 hover:bg-c-amber/20 text-c-amber font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
            >
              <FlaskConical className="w-4 h-4" />
              Enter Simulation Mode
            </button>
          )}

          <div className="w-full mt-6 pt-4 border-t border-hair-strong text-center">
            {isSignUp ? (
              <p className="text-sm text-ink-muted">
                Already have an account?{" "}
                <button
                  onClick={() => setIsSignUp(false)}
                  className="text-accent hover:underline font-medium"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p className="text-sm text-ink-muted">
                Don't have an operator credential?{" "}
                <button
                  onClick={() => setIsSignUp(true)}
                  className="text-accent hover:underline font-medium"
                >
                  Create Account
                </button>
              </p>
            )}
          </div>

          <div
            className={`mt-6 flex items-start gap-2 px-3 py-1.5 rounded-lg max-w-full border ${
              statusIsError
                ? "bg-c-red/10 border-c-red/30"
                : "bg-c-green/10 border-c-green/20 rounded-full"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
                statusIsError ? "bg-c-red" : "bg-c-green animate-pulse"
              }`}
            ></span>
            <span
              role={statusIsError ? "alert" : undefined}
              className={`font-mono text-xs tracking-wider ${
                statusIsError
                  ? "text-c-red text-left leading-relaxed"
                  : "text-c-green uppercase"
              }`}
            >
              {statusText}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
