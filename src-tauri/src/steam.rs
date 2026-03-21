use steamworks::Client;

use std::sync::Mutex;

pub struct SteamState {
    pub client: Option<Client>,
}

impl SteamState {
    pub fn new() -> Self {
        Self { client: None }
    }
}

#[tauri::command]
pub fn init_steam(state: tauri::State<Mutex<SteamState>>) -> Result<(), String> {
    let mut lock = state.lock().unwrap();

    let client = Client::init().unwrap();
    println!("[STEAM] Steam initialized");

    let utils = client.utils();
    println!("[STEAM] AppId: {:?}", utils.app_id());


    let client_clone = client.clone();
    std::thread::spawn(move || {
        loop {
            client_clone.run_callbacks();
            std::thread::sleep(std::time::Duration::from_millis(16));
        }
    });

    let friends = client.friends();
    friends.set_rich_presence("status", Some("Let's dance"));


    lock.client = Some(client);

    Ok(())
}



#[tauri::command]
pub fn update_steam_rpc(state: tauri::State<Mutex<SteamState>>, key: String, value: String,) -> Result<(), String> {
    let lock = state.lock().unwrap();

    if let Some(client) = lock.client.as_ref() {
        let friends = client.friends();
        let value_opt = if value.is_empty() {
            None
        } else {
            Some(value.as_str())
        };
        friends.set_rich_presence(&key, value_opt);
        Ok(())
    } else {
        Err("Steam not initialized".into())
    }
}


#[tauri::command]
pub fn clear_steam_rpc(state: tauri::State<Mutex<SteamState>>) -> Result<(), String> {
    println!("[STEAM] clear_steam_rpc");

    let lock = state.lock().unwrap();

    if let Some(client) = lock.client.as_ref() {
        client.friends().clear_rich_presence();
        Ok(())
    } else {
        Err("Steam not initialized".into())
    }
}
