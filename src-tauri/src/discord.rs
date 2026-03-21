use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};

use std::sync::Mutex;

pub struct DiscordState {
    pub client: Option<DiscordIpcClient>,
}

impl DiscordState {
    pub fn new() -> Self {
        Self { client: None }
    }
}

#[tauri::command]
pub fn init_discord(state: tauri::State<Mutex<DiscordState>>) -> Result<(), String> {
    let mut lock = state.lock().unwrap();

    let mut client = DiscordIpcClient::new("1360379286720352366")
        .map_err(|e| format!("{:?}", e))?;
    client.connect()
        .map_err(|e| format!("{:?}", e))?;

    client.set_activity(activity::Activity::new().details("Let's dance !"))
        .map_err(|e| format!("{:?}", e))?;

    println!("[Discord] Discord initialized");
    lock.client = Some(client);

    Ok(())
}


#[tauri::command]
pub fn update_discord_rpc( state: tauri::State<Mutex<DiscordState>>, details: String, state_text: String) -> Result<(), String> {
    let mut lock = state.lock().unwrap();

    if let Some(client) = lock.client.as_mut() {
        let mut activity = activity::Activity::new();

        if !details.is_empty() {
            activity = activity.details(&details);
        }

        if !state_text.is_empty() {
            activity = activity.state(&state_text);
        }

        client.set_activity(activity)
        .map_err(|e| format!("{:?}", e))?;
        
        Ok(())
    } else {
        Err("RPC not initialized".into())
    }
}


#[tauri::command]
pub fn clear_discord_rpc(state: tauri::State<Mutex<DiscordState>>) -> Result<(), String> {
    let mut lock = state.lock().unwrap();

    if let Some(client) = lock.client.as_mut() {
        client.clear_activity().map_err(|e| format!("{:?}", e))?;
        Ok(())
    } else {
        Err("RPC not initialized".into())
    }
}
