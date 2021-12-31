package RepaDex;


import java.io.DataInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map.Entry;
import java.util.Set;
import java.util.concurrent.Executors;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;


public class WebServer 
{
	private static boolean compareFiles(File f1, File f2) {
	    long i1 = f1.length();
	    long i2 = f2.length();
	    if (i1 != i2) {
	        return false;
	    }
        DataInputStream dis = null;
        DataInputStream dis1 = null;
	    try {
	        byte b1, b2;
	        dis = new DataInputStream(new FileInputStream(f1));
	        dis1 = new DataInputStream(new FileInputStream(f2));
	        while (true) {
	            b1 = dis.readByte();
	            b2 = dis1.readByte();
	            if (b1 != b2) {
	            	dis.close();
	            	dis1.close();
	                return false;
	            }
	        }
	    } catch (IOException ex) {
	        return true;
	    }
	    finally
	    {
	    	try
	    	{
		    	if(dis!=null)
		    	{
		    		dis.close();
		    	}
		    	if(dis1!=null)
		    	{
		    		dis1.close();
		    	}
	    	}
	    	catch(IOException e)
	    	{
	    		e.printStackTrace();
	    	}
	    }
	}
	static boolean areDirsEqual(File original, File source) {
	    File[] originalList = original.listFiles(), sourceList = source.listFiles();
	    for (int i = 0; i < sourceList.length; i++) {
	        if (originalList[i].isFile() && sourceList[i].isFile()) {
	            if (!compareFiles(originalList[i], sourceList[i])) {
	                return false;
	            }
	        } else if (originalList[i].isDirectory() && sourceList[i].isDirectory()) {
	            if (!areDirsEqual(originalList[i], sourceList[i])) {
	                return false;
	            }
	        } else {
	            return false;
	        }
	    }
	    return true;
	}
	public static void copyFolder(File source, File destination)
	{
	    if (source.isDirectory())
	    {
	        if (!destination.exists())
	        {
	            destination.mkdirs();
	        }

	        String files[] = source.list();

	        for (String file : files)
	        {
	            File srcFile = new File(source, file);
	            File destFile = new File(destination, file);

	            copyFolder(srcFile, destFile);
	        }
	    }
	    else
	    {
	        InputStream in = null;
	        OutputStream out = null;

	        try
	        {
	            in = new FileInputStream(source);
	            out = new FileOutputStream(destination);

	            byte[] buffer = new byte[1024];

	            int length;
	            while ((length = in.read(buffer)) > 0)
	            {
	                out.write(buffer, 0, length);
	            }
	        }
	        catch (Exception e)
	        {
	            try
	            {
	                in.close();
	            }
	            catch (IOException e1)
	            {
	                e1.printStackTrace();
	            }

	            try
	            {
	                out.close();
	            }
	            catch (IOException e1)
	            {
	                e1.printStackTrace();
	            }
	        }
	    }
	}
	static void deleteAndCopy(File source, File destination)
	{
		destination.delete();
		copyFolder(source, destination);
	}
	static void setup(boolean onLaptop)
	{
		File workingDirectory = new File(RepaDexMain.workingPath);
		File serverDirectory = new File(RepaDexMain.serverLocation);
		if(!workingDirectory.exists())
		{
			workingDirectory.mkdir();
		}
		if(!areDirsEqual(workingDirectory, serverDirectory))
		{
			deleteAndCopy(serverDirectory, workingDirectory);
		}
	}
	static void start(boolean onLaptop) throws IOException
	{
		setup(onLaptop);
		new WebServer();
	}
	public WebServer() throws IOException
	{
		HttpServer server = HttpServer.create(new InetSocketAddress(80), 0);
        server.createContext("/", new GeneralHandler());
        //server.setExecutor(null);
        server.setExecutor(Executors.newCachedThreadPool());
        server.start();
	}
	static void doGet(HttpExchange t) throws IOException
	{
		OutputStream os = t.getResponseBody();
		File f = new File(RepaDexMain.workingPath+"/html"+t.getRequestURI());
		if(!f.exists())
		{
			String response = "File not found";
	    	t.sendResponseHeaders(404, response.length());
			os.write(response.getBytes());
		}
		else if(f.isDirectory())
		{
			File index = new File(f.getAbsolutePath()+"/index.html");
			if(index.exists())
			{
		    	t.sendResponseHeaders(200, index.length());
		        os.write(Files.readAllBytes(Paths.get(index.getPath())));
			}
			else
			{ 
				String response = "directory";
		    	t.sendResponseHeaders(200, response.length());
				os.write(response.getBytes());
			}
		}
		else
		{
	    	t.sendResponseHeaders(200, f.length());
	        os.write(Files.readAllBytes(Paths.get(f.getPath())));
		}
        os.close();
	}
	static String readLine(InputStream is) throws IOException
	{
    	StringBuilder boundBuilder = new StringBuilder();
    	char c = (char) is.read();
		boundBuilder.append(c);
    	while(c!='\n')
    	{
    		c = (char) is.read();
    		boundBuilder.append(c);
    	}
    	return boundBuilder.toString();
	}
	static class GeneralHandler implements HttpHandler
	{
		public GeneralHandler() 
		{
			//System.out.println("Loading Website Page "+path); 
		}
	    @Override
	    public void handle(HttpExchange t) throws IOException {
	    	System.out.println(t.getRequestMethod()+" "+t.getRequestURI());
	    	if(t.getRequestMethod().equals("GET"))
	    	{
		    	doGet(t);
	    	}
	    	else if(t.getRequestMethod().equals("POST"))
	    	{
	    		Set<Entry<String, List<String>>> es = t.getRequestHeaders().entrySet();
	    		for(Entry<String, List<String>> e : es)
	    		{
	    			System.out.print(e.getKey()+"\t");
	    			for(String e1 : e.getValue())
		    		{
		    			System.out.print(e1+" | ");
		    		}
	    			System.out.println();
	    		}
	    	}
			System.out.println("done");
			String response = "done";
	    	t.sendResponseHeaders(200, response.length());
			OutputStream os = t.getResponseBody();
			os.write(response.getBytes());
	        os.close();
//	    	System.out.println("connection from: "+t.getRemoteAddress());
	    	//HTML = loadFile();
	    }
	}
}