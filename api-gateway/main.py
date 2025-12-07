from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
import httpx
import os

app = FastAPI(title="DistML API Gateway")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins like ["http://localhost:3000", "http://localhost:3002"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

JOB_ORCHESTRATOR_URL = os.getenv("JOB_ORCHESTRATOR_URL", "http://job-orchestrator:5000")
SECRET_KEY = os.getenv("JWT_SECRET", "a-very-secret-key")
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return {"username": username}

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # In a real app, you'd verify username/password against a database
    # Here we'll just accept any username and password for demonstration
    user = {"sub": form_data.username}
    access_token = jwt.encode(user, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": access_token, "token_type": "bearer"}

@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def route_to_orchestrator(path: str, request: Request, user: dict = Depends(get_current_user)):
    async with httpx.AsyncClient() as client:
        url = f"{JOB_ORCHESTRATOR_URL}/{path}"
        
        body = None
        if request.method in ["POST", "PUT"]:
            try:
                body = await request.json()
            except Exception:
                body = None

        try:
            rp = await client.request(
                method=request.method,
                url=url,
                headers={k: v for k, v in request.headers.items() if k.lower() not in ['host', 'authorization', 'content-length']},
                params=request.query_params,
                json=body,
                timeout=30.0,
            )
            rp.raise_for_status()
            return rp.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Service unavailable: {e}")

