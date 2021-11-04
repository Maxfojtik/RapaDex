package RepaDex;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.security.KeyFactory;
import java.security.KeyStore;
import java.security.NoSuchAlgorithmException;
import java.security.cert.CertificateFactory;
import java.security.interfaces.RSAPrivateKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map.Entry;
import java.util.Set;
import java.util.UUID;

import javax.net.ssl.KeyManager;
import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import java.security.cert.Certificate;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.DefaultSSLWebSocketServerFactory;
import org.java_websocket.server.WebSocketServer;


class WS extends WebSocketServer 
{
	public WS() {
		super(new InetSocketAddress(6548));
//		SSLContext context = getContext();
//		if (context != null) {
//	      setWebSocketFactory(new DefaultSSLWebSocketServerFactory(getContext()));
//	    }
	}
	static HashMap<String, WebSocket> connections = new HashMap<>();//by UUID
	static String getUUIDByWebSocket(WebSocket ws)
	{
		for(Entry<String, WebSocket> s : connections.entrySet())
		{
			if(s.getValue().equals(ws))
			{
				return s.getKey();
			}
		}
		return null;
	}
	static void send(WebSocket conn, String toSend)
	{
		try
		{
			String str = conn.getRemoteSocketAddress().getAddress().getHostAddress()+" <- "+toSend;
			System.out.println("<-"+str);
			conn.send(toSend);
		}
		catch(Exception e)
		{
			e.printStackTrace();
		}
	}
	static void sendError(String UUID, String error)
	{
		WebSocket ws = connections.get(UUID);
		send(ws, "Error|"+error);
	}
	public void broadcast(String toSend)
	{
		String str = "SYSTEM <- "+toSend;
		System.out.println(str);
		super.broadcast(toSend);
	}
	@Override
	public void onOpen(WebSocket conn, ClientHandshake handshake) {
		String thisUUID = UUID.randomUUID().toString();
		send(conn, "UUIDSet|"+thisUUID);
		connections.put(thisUUID, conn);
		System.out.println(conn.getRemoteSocketAddress().getAddress().getHostAddress() + " connected "+thisUUID);
	}
	void deleteDir(File file) {
	    File[] contents = file.listFiles();
	    if (contents != null) {
	        for (File f : contents) {
	            deleteDir(f);
	        }
	    }
	    file.delete();
	}
	@Override
	public void onClose(WebSocket conn, int code, String reason, boolean remote) {
		String UUID = getUUIDByWebSocket(conn);
		boolean removed = connections.remove(UUID) != null;
		System.out.println(conn.getRemoteSocketAddress().getAddress().getHostAddress() + " disconnected; "+(removed ? "Removed successfully " : " NOT REMOVED, DESYNC IMMINENT"));
		//File folder = new File(EClub.workingPath+"\\uploads\\"+UUID);
		//deleteDir(folder);
	}

	@Override
	public void onMessage(WebSocket conn, String message) 
	{
		try
		{
			String messageStr = conn.getRemoteSocketAddress().getAddress().getHostAddress() + " -> " + message;
			System.out.println(messageStr);
			String[] params = message.split("\\|");
			if(params[0].equals("FileUpload"))
			{
				
			}
		}
		catch(Exception e) {e.printStackTrace();send(conn, "Error|"+e.toString());}
	}
	@Override
	public void onError(WebSocket conn, Exception ex) {
		System.out.println("websocket error: "+ex.getMessage());
		if(ex.getMessage().contains("Address already in use"))
		{
			try {
				stop(0);
			} catch (InterruptedException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			System.out.println("restarting WS");
			restartWS();
		}
		ex.printStackTrace();
	}

	@Override
	public void onStart() {
	    setConnectionLostTimeout(60);
	}
	static void restartWS()
	{
		new Thread(new restartWSThread()).start();
	}
	static class restartWSThread implements Runnable
	{
		@Override
		public void run() 
		{
			try {
				Thread.sleep(5000);
			} catch (InterruptedException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			RepaDexMain.ws = new WS();
			RepaDexMain.ws.start();
		}
	}
}