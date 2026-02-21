import json
from typing import List, Dict, Any

class BaseAdapter:
    def generate_python_call(self, method_name: str, args: List[Dict[str, str]]) -> str:
        parsers = []
        arg_names = []
        for i, arg in enumerate(args):
            name = arg.get("name", f"arg{i}")
            arg_type = arg.get("type", "int")
            arg_names.append(name)
            
            if "List" in arg_type or "vector" in arg_type:
                parsers.append(f"{name} = json.loads(next(it))")
            elif arg_type == "int":
                parsers.append(f"{name} = int(next(it))")
            else:
                parsers.append(f"{name} = next(it)")
        
        call_logic = "\n            ".join(parsers)
        return f"{call_logic}\n            result = sol.{method_name}({', '.join(arg_names)})"

    def generate_js_call(self, method_name: str, args: List[Dict[str, str]]) -> str:
        parsers = []
        arg_names = []
        for i, arg in enumerate(args):
            name = arg.get("name", f"arg{i}")
            arg_type = arg.get("type", "int")
            arg_names.append(name)
            
            if "List" in arg_type or "vector" in arg_type:
                parsers.append(f"let {name} = JSON.parse(input[idx++].trim());")
            elif arg_type == "int":
                parsers.append(f"let {name} = parseInt(input[idx++].trim());")
            else:
                parsers.append(f"let {name} = input[idx++].trim();")
                
        call_logic = "\n        ".join(parsers)
        return f"{call_logic}\n        const result = sol.{method_name}({', '.join(arg_names)});"

def get_template_injection(language: str, metadata: Dict[str, Any]) -> Dict[str, str]:
    method_name = metadata.get("method_name", "solve")
    args = metadata.get("args", [])
    
    adapter = BaseAdapter()
    if language == "python":
        return {
            "METHOD_NAME": method_name,
            "CALL_LOGIC": adapter.generate_python_call(method_name, args)
        }
    if language == "javascript":
        return {
            "METHOD_NAME": method_name,
            "CALL_LOGIC": adapter.generate_js_call(method_name, args)
        }
    # C++ logic is more complex due to static typing, for now we assume specific template
    return {"METHOD_NAME": method_name}
