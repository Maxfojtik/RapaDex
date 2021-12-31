package RepaDex;

import java.io.IOException;

public class RepaDexMain 
{
	static final String workingPath = System.getenv("APPDATA")+"\\RepaDexServer\\";
	static final String serverLocation = "K:\\BF\\PRSM\\TechHub\\Service request\\RepaDex";
	static final String laptopServerLocation = "K:\\BF\\PRSM\\TechHub\\Service request\\RepaDex";
	static boolean onLaptop = true;
	static WS ws;
	public static void main(String args[]) throws IOException
	{
		System.out.println("starting HTTP server");
		WebServer.start(onLaptop);
		System.out.println("starting websocket");
		ws = new WS();
		ws.start();
		System.out.println("ready.");
	}
}
