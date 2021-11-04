package RepaDex;

import java.io.IOException;

public class RepaDexMain 
{
	static final String workingPath = "%appdata%\\RepaDex";
	static final String serverLocation = "K:\\BF\\PRSM\\TechHub\\Service request\\RepaDex";
	static WS ws;
	public static void main(String args[]) throws IOException
	{
		System.out.println("starting HTTP server");
		WebServer.start();
		System.out.println("starting websocket");
		ws = new WS();
		ws.start();
		System.out.println("ready.");
	}
}
