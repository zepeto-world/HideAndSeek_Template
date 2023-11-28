// Made with Amplify Shader Editor
// Available at the Unity Asset Store - http://u3d.as/y3X 
Shader "Particle/FX_Rimlight_Additive"
{
	Properties
	{
		_Main_Texture("Main_Texture", 2D) = "white" {}
		_U_Tiling("U_Tiling", Float) = 1
		_V_Tiling("V_Tiling", Float) = 1
		_U_Panning("U_Panning", Float) = 0
		_V_Panning("V_Panning", Float) = -0.2
		_Scale("Scale", Float) = 1
		_Power("Power", Float) = 2.047
		_Color("Color", Color) = (1,1,1,0)
		_Bias("Bias", Float) = 0
		[Toggle]_Screen_Position("Screen_Position", Float) = 1
		[HideInInspector] _texcoord( "", 2D ) = "white" {}
		[HideInInspector] __dirty( "", Int ) = 1
	}

	SubShader
	{
		Tags{ "RenderType" = "Transparent"  "Queue" = "AlphaTest+0" "IsEmissive" = "true"  }
		Cull Back
		Blend SrcAlpha One , SrcAlpha One
		
		CGPROGRAM
		#include "UnityShaderVariables.cginc"
		#pragma target 3.0
		#pragma surface surf Unlit keepalpha noshadow 
		struct Input
		{
			float4 screenPos;
			float2 uv_texcoord;
			float3 worldPos;
			float3 worldNormal;
			float4 vertexColor : COLOR;
		};

		uniform float4 _Color;
		uniform sampler2D _Main_Texture;
		uniform float _U_Panning;
		uniform float _V_Panning;
		uniform float _Screen_Position;
		uniform float _U_Tiling;
		uniform float _V_Tiling;
		uniform float _Bias;
		uniform float _Scale;
		uniform float _Power;

		inline half4 LightingUnlit( SurfaceOutput s, half3 lightDir, half atten )
		{
			return half4 ( 0, 0, 0, s.Alpha );
		}

		void surf( Input i , inout SurfaceOutput o )
		{
			float4 appendResult11 = (float4(_U_Panning , _V_Panning , 0.0 , 0.0));
			float4 temp_cast_1 = (1.0).xxxx;
			float4 ase_screenPos = float4( i.screenPos.xyz , i.screenPos.w + 0.00000000001 );
			float4 ase_screenPosNorm = ase_screenPos / ase_screenPos.w;
			ase_screenPosNorm.z = ( UNITY_NEAR_CLIP_VALUE >= 0 ) ? ase_screenPosNorm.z : ase_screenPosNorm.z * 0.5 + 0.5;
			float4 appendResult8 = (float4(_U_Tiling , _V_Tiling , 0.0 , 0.0));
			float2 uv_TexCoord3 = i.uv_texcoord * appendResult8.xy;
			float2 panner2 = ( 1.0 * _Time.y * appendResult11.xy + ( lerp(temp_cast_1,ase_screenPosNorm,_Screen_Position) * float4( uv_TexCoord3, 0.0 , 0.0 ) ).xy);
			float3 ase_worldPos = i.worldPos;
			float3 ase_worldViewDir = normalize( UnityWorldSpaceViewDir( ase_worldPos ) );
			float3 ase_worldNormal = i.worldNormal;
			float fresnelNdotV19 = dot( ase_worldNormal, ase_worldViewDir );
			float fresnelNode19 = ( _Bias + _Scale * pow( 1.0 - fresnelNdotV19, _Power ) );
			o.Emission = ( _Color * ( ( tex2D( _Main_Texture, panner2 ) * fresnelNode19 ) * i.vertexColor ) ).rgb;
			o.Alpha = i.vertexColor.a;
		}

		ENDCG
	}
	CustomEditor "ASEMaterialInspector"
}
/*ASEBEGIN
Version=17000
3330;146;2105;1074;2941.513;814.5297;1;True;True
Node;AmplifyShaderEditor.RangedFloatNode;5;-2593.668,-110.2491;Float;False;Property;_V_Tiling;V_Tiling;3;0;Create;True;0;0;False;0;1;1;0;0;0;1;FLOAT;0
Node;AmplifyShaderEditor.RangedFloatNode;4;-2592.188,-204.7434;Float;False;Property;_U_Tiling;U_Tiling;1;0;Create;True;0;0;False;0;1;3;0;0;0;1;FLOAT;0
Node;AmplifyShaderEditor.ScreenPosInputsNode;27;-2429.43,-404.9725;Float;False;0;False;0;5;FLOAT4;0;FLOAT;1;FLOAT;2;FLOAT;3;FLOAT;4
Node;AmplifyShaderEditor.RangedFloatNode;48;-2388.083,-567.3102;Float;False;Constant;_Float0;Float 0;11;0;Create;True;0;0;False;0;1;0;0;0;0;1;FLOAT;0
Node;AmplifyShaderEditor.DynamicAppendNode;8;-2374.139,-154.0672;Float;False;FLOAT4;4;0;FLOAT;0;False;1;FLOAT;0;False;2;FLOAT;0;False;3;FLOAT;0;False;1;FLOAT4;0
Node;AmplifyShaderEditor.RangedFloatNode;10;-2590.26,174.9124;Float;False;Property;_V_Panning;V_Panning;5;0;Create;True;0;0;False;0;-0.2;-0.2;0;0;0;1;FLOAT;0
Node;AmplifyShaderEditor.RangedFloatNode;9;-2589.086,72.1586;Float;False;Property;_U_Panning;U_Panning;4;0;Create;True;0;0;False;0;0;0;0;0;0;1;FLOAT;0
Node;AmplifyShaderEditor.TextureCoordinatesNode;3;-2168.798,-165.2953;Float;False;0;-1;2;3;2;SAMPLER2D;;False;0;FLOAT2;1,1;False;1;FLOAT2;0,0;False;5;FLOAT2;0;FLOAT;1;FLOAT;2;FLOAT;3;FLOAT;4
Node;AmplifyShaderEditor.ToggleSwitchNode;47;-2081.648,-469.7695;Float;False;Property;_Screen_Position;Screen_Position;10;0;Create;True;0;0;False;0;1;2;0;FLOAT4;0,0,0,0;False;1;FLOAT4;0,0,0,0;False;1;FLOAT4;0
Node;AmplifyShaderEditor.SimpleMultiplyOpNode;28;-1868.429,-226.9848;Float;False;2;2;0;FLOAT4;0,0,0,0;False;1;FLOAT2;0,0;False;1;FLOAT4;0
Node;AmplifyShaderEditor.DynamicAppendNode;11;-2354.734,92.64252;Float;False;FLOAT4;4;0;FLOAT;0;False;1;FLOAT;0;False;2;FLOAT;0;False;3;FLOAT;0;False;1;FLOAT4;0
Node;AmplifyShaderEditor.RangedFloatNode;20;-1277.719,311.6595;Float;False;Property;_Scale;Scale;6;0;Create;True;0;0;False;0;1;-14.53;0;0;0;1;FLOAT;0
Node;AmplifyShaderEditor.RangedFloatNode;15;-1283.132,454.5221;Float;False;Property;_Power;Power;7;0;Create;True;0;0;False;0;2.047;9.35;0;0;0;1;FLOAT;0
Node;AmplifyShaderEditor.RangedFloatNode;46;-1263.524,186.1734;Float;False;Property;_Bias;Bias;9;0;Create;True;0;0;False;0;0;0;0;0;0;1;FLOAT;0
Node;AmplifyShaderEditor.PannerNode;2;-1600.695,-166.8116;Float;False;3;0;FLOAT2;0,0;False;2;FLOAT2;0,0;False;1;FLOAT;1;False;1;FLOAT2;0
Node;AmplifyShaderEditor.SamplerNode;1;-1402.279,-108.8481;Float;True;Property;_Main_Texture;Main_Texture;0;0;Create;True;0;0;False;0;ab21ae87b20e6374eb5854d3fcd386e0;ab21ae87b20e6374eb5854d3fcd386e0;True;0;False;white;Auto;False;Object;-1;Auto;Texture2D;6;0;SAMPLER2D;;False;1;FLOAT2;0,0;False;2;FLOAT;0;False;3;FLOAT2;0,0;False;4;FLOAT2;0,0;False;5;FLOAT;1;False;5;COLOR;0;FLOAT;1;FLOAT;2;FLOAT;3;FLOAT;4
Node;AmplifyShaderEditor.FresnelNode;19;-1022.047,141.25;Float;False;Standard;WorldNormal;ViewDir;False;5;0;FLOAT3;0,0,1;False;4;FLOAT3;0,0,0;False;1;FLOAT;0;False;2;FLOAT;1;False;3;FLOAT;2;False;1;FLOAT;0
Node;AmplifyShaderEditor.VertexColorNode;21;-680.9714,215.8904;Float;False;0;5;COLOR;0;FLOAT;1;FLOAT;2;FLOAT;3;FLOAT;4
Node;AmplifyShaderEditor.SimpleMultiplyOpNode;45;-663.9202,21.62926;Float;False;2;2;0;COLOR;0,0,0,0;False;1;FLOAT;0;False;1;COLOR;0
Node;AmplifyShaderEditor.SimpleMultiplyOpNode;22;-410.7289,50.81524;Float;False;2;2;0;COLOR;0,0,0,0;False;1;COLOR;0,0,0,0;False;1;COLOR;0
Node;AmplifyShaderEditor.ColorNode;26;-468.9514,-226.8779;Float;False;Property;_Color;Color;8;0;Create;True;0;0;False;0;1,1,1,0;0.8018868,0.1163398,0,1;True;0;5;COLOR;0;FLOAT;1;FLOAT;2;FLOAT;3;FLOAT;4
Node;AmplifyShaderEditor.SimpleMultiplyOpNode;25;-189.223,-36.26822;Float;False;2;2;0;COLOR;0,0,0,0;False;1;COLOR;0,0,0,0;False;1;COLOR;0
Node;AmplifyShaderEditor.StandardSurfaceOutputNode;0;0,0;Float;False;True;2;Float;ASEMaterialInspector;0;0;Unlit;Particle/FX_Rimlight_Additive;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;False;Back;0;False;-1;0;False;-1;False;0;False;-1;0;False;-1;False;0;Custom;0.5;True;False;0;True;Transparent;;AlphaTest;All;True;True;True;True;True;True;True;True;True;True;True;True;True;True;True;True;True;0;False;-1;False;0;False;-1;255;False;-1;255;False;-1;0;False;-1;0;False;-1;0;False;-1;0;False;-1;0;False;-1;0;False;-1;0;False;-1;0;False;-1;False;2;15;10;25;False;0.5;False;8;5;False;-1;1;False;-1;8;5;False;-1;1;False;-1;0;False;-1;0;False;-1;0;False;0;0,0,0,0;VertexOffset;True;False;Cylindrical;False;Relative;0;;2;-1;-1;-1;0;False;0;0;False;-1;-1;0;False;-1;0;0;0;False;0.1;False;-1;0;False;-1;15;0;FLOAT3;0,0,0;False;1;FLOAT3;0,0,0;False;2;FLOAT3;0,0,0;False;3;FLOAT;0;False;4;FLOAT;0;False;6;FLOAT3;0,0,0;False;7;FLOAT3;0,0,0;False;8;FLOAT;0;False;9;FLOAT;0;False;10;FLOAT;0;False;13;FLOAT3;0,0,0;False;11;FLOAT3;0,0,0;False;12;FLOAT3;0,0,0;False;14;FLOAT4;0,0,0,0;False;15;FLOAT3;0,0,0;False;0
WireConnection;8;0;4;0
WireConnection;8;1;5;0
WireConnection;3;0;8;0
WireConnection;47;0;48;0
WireConnection;47;1;27;0
WireConnection;28;0;47;0
WireConnection;28;1;3;0
WireConnection;11;0;9;0
WireConnection;11;1;10;0
WireConnection;2;0;28;0
WireConnection;2;2;11;0
WireConnection;1;1;2;0
WireConnection;19;1;46;0
WireConnection;19;2;20;0
WireConnection;19;3;15;0
WireConnection;45;0;1;0
WireConnection;45;1;19;0
WireConnection;22;0;45;0
WireConnection;22;1;21;0
WireConnection;25;0;26;0
WireConnection;25;1;22;0
WireConnection;0;2;25;0
WireConnection;0;9;21;4
ASEEND*/
//CHKSM=D9277B13DE5BBEBD1E38B52250C0BD90009E6B26